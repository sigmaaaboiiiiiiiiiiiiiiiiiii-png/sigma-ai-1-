import React, { useState } from 'react';
import {
  Download,
  Eye,
  Pencil,
  RefreshCw,
  Check,
  Loader2,
  Send,
  BarChart3,
  Table,
  X,
  FunctionSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ExcelWorkbookData, ExcelCellData, ExcelColumnSpec } from '../../types/excel';
import { downloadWorkbookAsXlsx } from '../../lib/xlsxDownloader';
import { applyExcelModification } from '../../lib/excelGenerator';
import { ExcelSpreadsheetIcon } from './ExcelIcon';

import { detectBadLanguage } from '../../lib/badLanguageDetector';

interface ExcelResultCardProps {
  workbook: ExcelWorkbookData;
  onRequestModification?: (instruction: string, updated?: ExcelWorkbookData) => void;
}

/**
 * Dynamically computes strictly relevant modification options based on the
 * actual subject and column structure of the current workbook.
 */
function getRelevantQuickEdits(workbook: ExcelWorkbookData): string[] {
  const primarySheet = workbook.sheets[0];
  const colHeaders = (primarySheet?.columns || []).map((c) => c.header.toLowerCase()).join(' ');
  const combinedContext = `${workbook.title} ${workbook.subtitle} ${workbook.topic || ''} ${colHeaders}`.toLowerCase();

  const isReligion = /\b(religion|religions|faith|faiths|theology|belief|beliefs|islam|christianity|hinduism|buddhism|judaism|sikhism|adherent)\b/i.test(
    combinedContext
  );

  if (isReligion) {
    return [
      'Add 5 More World Religions',
      'Sort by Global Adherents',
      'Add a pie chart',
      'Add a bar chart',
      'Highlight Major Faiths (≥ 500M)',
      'Add Historical Eras & Timeline Sheet',
    ];
  }

  const isGames = /\b(game|games|gaming|videogame|videogames)\b/i.test(combinedContext);
  if (isGames) {
    return [
      'Add 5 More Best-Selling Games',
      'Sort by Global Sales',
      'Sort by Metacritic Score',
      'Highlight Blockbusters (≥ 100M)',
      'Add a bar chart',
      'Create Genre Market Share Sheet',
    ];
  }

  const isPetSheet = /\b(cat|cats|pet|pets|kitten|feline|dog|puppy|animal|breed)\b/i.test(
    combinedContext
  );

  if (isPetSheet) {
    return [
      'Add 5 More Cat Breeds',
      'Sort by Cat Weight',
      'Add a bar chart',
      'Add a pie chart',
      'Highlight Checkup Due',
      'Create Veterinary Diet & Nutrition Sheet',
    ];
  }

  const isAi = /\b(ai|artificial\s+intelligence|machine\s+learning|deep\s+learning|llm|llms|gpt|neural|transformer|deepseek|claude|gemini|openai|anthropic|mistral|llama|model|models|benchmark|parameters|token|tokens|gpu)\b/i.test(
    combinedContext
  );

  if (isAi) {
    return [
      'Add 5 More AI Models & LLMs',
      'Sort by Benchmark Accuracy',
      'Highlight Top AI Models (≥ 90%)',
      'Add a bar chart comparing Model Accuracy',
      'Create AI Architecture & Training Sheet',
      'Add Compute & Cost Analysis',
    ];
  }

  const isMarksheet =
    !isAi &&
    /\b(student|pupil|roll\s*no|marksheet|report\s*card)\b/i.test(combinedContext) &&
    /\b(marks|grade|exam|academic)\b/i.test(combinedContext);

  if (isMarksheet) {
    const edits: string[] = [];
    edits.push('Add 5 More Students');
    edits.push('Sort by Highest Marks');
    edits.push('Highlight Failing Marks (< 50)');
    edits.push('Highlight Top Achievers (≥ 90%)');
    edits.push('Add a bar chart');
    edits.push('Add Class Average row');
    return edits;
  }

  const isSuperhero = /\b(superman|batman|superhero|superheroes|dc|marvel|avengers|justice\s+league|gotham|krypton)\b/i.test(combinedContext);
  if (isSuperhero) {
    return [
      'Add 5 More Characters',
      'Sort by Power Level',
      'Highlight Top Heroes (≥ 95)',
      'Add a bar chart',
      'Add a pie chart',
      'Create Movies & Box Office Sheet',
    ];
  }

  const isInventory = /\b(inventory|stock|product|item|warehouse|quantity)\b/i.test(combinedContext);
  if (isInventory) {
    return [
      'Add 5 More Items',
      'Highlight Low Stock (< 10)',
      'Sort by Quantity',
      'Add a bar chart',
      'Create Stock Summary Sheet',
    ];
  }

  const isFinancial = /\b(budget|finance|revenue|expense|expenses|spending|salary|profit|invoice)\b/i.test(combinedContext);
  if (isFinancial) {
    return [
      'Add 5 More Transactions',
      'Sort by Amount',
      'Add a bar chart',
      'Add a pie chart',
      'Create Category Summary Sheet',
    ];
  }

  // Pure custom topic fallback: strictly tailored without any financial references
  const firstColHeader = primarySheet?.columns[0]?.header || 'Item';
  const numCol = primarySheet?.columns.find((c) => c.format === 'number' || c.format === 'percentage');
  const edits: string[] = [`Add 5 More ${firstColHeader}s`];
  if (numCol) {
    edits.push(`Sort by ${numCol.header}`);
  }
  edits.push('Add a bar chart');
  edits.push('Add a pie chart');
  edits.push('Create Detailed Summary Sheet');
  return edits;
}

const CHART_COLORS = ['#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];

export const ExcelResultCard: React.FC<ExcelResultCardProps> = ({
  workbook: initialWorkbook,
  onRequestModification,
}) => {
  const [currentWorkbook, setCurrentWorkbook] = useState<ExcelWorkbookData>(initialWorkbook);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    coord: string;
    formula?: string;
    value: string | number;
  } | null>(null);
  const [showChartTab, setShowChartTab] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [customEdit, setCustomEdit] = useState('');
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [modalViewTab, setModalViewTab] = useState<'grid' | 'chart' | 'both'>('grid');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const dynamicQuickEdits = React.useMemo(
    () => getRelevantQuickEdits(currentWorkbook),
    [currentWorkbook]
  );

  const activeSheet =
    currentWorkbook.sheets[activeSheetIdx] || currentWorkbook.sheets[0];

  const formatCellDisplay = (cell?: ExcelCellData, col?: ExcelColumnSpec): string => {
    if (!cell || cell.value === undefined || cell.value === null) return '';
    const fmt = cell.format || col?.format;
    if (typeof cell.value === 'number') {
      if (fmt === 'currency') {
        return `${currentWorkbook.currencySymbol}${cell.value.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`;
      }
      if (fmt === 'percentage') {
        return `${cell.value}%`;
      }
      return cell.value.toLocaleString();
    }
    return String(cell.value);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadWorkbookAsXlsx(currentWorkbook);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to export XLSX:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApplyEdit = (instruction: string) => {
    const trimmed = instruction.trim();
    if (!trimmed) return;
    if (detectBadLanguage(trimmed)) {
      setActionFeedback('Cannot proceed with request. Please write in proper English.');
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    // Determine if this is a new topic/character request (e.g. "of Batman", "Batman", "Superman")
    // or a modification instruction (e.g. "Add 5 More Rows", "Sort by Power", "Add Chart")
    let promptForAi = trimmed;
    const isOfTopic = /^(of|on|about)\s+[a-z0-9\s_-]+$/i.test(trimmed);
    const isBareTopic =
      /^[a-z0-9\s_-]{2,30}$/i.test(trimmed) &&
      !/^(add|sort|highlight|create|make|rename|remove|delete|change|update)\b/i.test(trimmed);

    if (isOfTopic) {
      const topicName = trimmed.replace(/^(of|on|about)\s+/i, '').trim();
      promptForAi = `Make an Excel spreadsheet on ${topicName}`;
    } else if (isBareTopic && !trimmed.toLowerCase().includes('sheet') && !trimmed.toLowerCase().includes('column')) {
      promptForAi = `Make an Excel spreadsheet on ${trimmed}`;
    } else if (!/^(make|create|generate|build|prepare|modify|update|add|sort|highlight)\b/i.test(trimmed)) {
      promptForAi = `Modify spreadsheet: ${trimmed}`;
    }

    // When from the Excel sheet option/drawer, send another prompt to AI so it generates/verifies via API
    if (onRequestModification) {
      onRequestModification(promptForAi);
      setCustomEdit('');
      setIsEditOpen(false);
      setActionFeedback(`✓ Sent to AI: "${promptForAi}"`);
      setTimeout(() => setActionFeedback(null), 3500);
      return;
    }

    // Direct local modification fallback if no chat callback is available
    const updated = applyExcelModification(currentWorkbook, instruction);
    setCurrentWorkbook(updated);
    setCustomEdit('');
    setActionFeedback(`✓ Applied: "${instruction}"`);
    setTimeout(() => setActionFeedback(null), 3500);

    // If a new worksheet was added, switch to it automatically
    if (updated.sheets.length > currentWorkbook.sheets.length) {
      setActiveSheetIdx(updated.sheets.length - 1);
      setShowChartTab(false);
    } else if (/\bchart\b/i.test(instruction)) {
      setShowChartTab(true);
    } else {
      setShowChartTab(false);
    }
  };

  const activeChart = currentWorkbook.charts?.[0];
  const chartData = React.useMemo(() => {
    if (!activeChart) return [];
    const targetSheet =
      currentWorkbook.sheets.find((s) => s.name === activeChart.sheetName) ||
      currentWorkbook.sheets[0];
    if (!targetSheet) return [];

    return targetSheet.rows
      .filter((r) => !r.isSummaryRow)
      .map((r) => {
        const label = String(r.cells[activeChart.labelColumnKey]?.value || '').slice(0, 18);
        const entry: Record<string, any> = { name: label };
        activeChart.valueColumnKeys.forEach((vk) => {
          entry[vk] = Number(r.cells[vk]?.value) || 0;
        });
        return entry;
      });
  }, [activeChart, currentWorkbook]);

  const renderSpreadsheetTable = (maxRows?: number) => {
    const rowsToShow = maxRows
      ? activeSheet.rows.slice(0, maxRows)
      : activeSheet.rows;

    return (
      <div className="w-full">
        {/* Formula Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0b131e] border-b border-slate-800 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
            {selectedCellInfo?.coord || 'A1'}
          </span>
          <FunctionSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-slate-300 truncate">
            {selectedCellInfo
              ? selectedCellInfo.formula || String(selectedCellInfo.value)
              : 'Click any cell to inspect its value or Excel formula (=SUM, =AVERAGE, =IF...)'}
          </span>
          <span className="ml-auto text-[10px] text-slate-500 font-mono hidden sm:inline">
            {activeSheet.rows.length} rows • {activeSheet.columns.length} cols
          </span>
        </div>

        <div className="w-full max-h-80 overflow-y-auto overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10">
            <tr
              style={{
                backgroundColor: currentWorkbook.palette.headerBg,
                color: currentWorkbook.palette.headerText,
              }}
            >
              <th className="py-2 px-2.5 border-b border-r border-slate-700/70 text-[10px] font-mono text-slate-300 text-center w-9">
                #
              </th>
              {activeSheet.columns.map((col, cIdx) => {
                const colLetter = String.fromCharCode(65 + cIdx);
                return (
                  <th
                    key={col.key}
                    className={`py-2 px-3 border-b border-r border-slate-700/60 font-bold whitespace-nowrap ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono opacity-60">{colLetter}</span>
                      <span>{col.header}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map((row, rIdx) => {
              const rowNum = rIdx + 2;
              const isSum = Boolean(row.isSummaryRow);
              return (
                <tr
                  key={row.id}
                  className={
                    isSum
                      ? 'bg-emerald-950/50 font-bold text-emerald-100 border-t-2 border-emerald-500/40'
                      : rIdx % 2 === 0
                      ? 'bg-[#0f1724] hover:bg-slate-800/60'
                      : 'bg-[#131d2e] hover:bg-slate-800/60'
                  }
                >
                  <td className="py-1.5 px-2 border-b border-r border-slate-800/80 text-[10px] font-mono text-slate-500 text-center">
                    {rowNum}
                  </td>
                  {activeSheet.columns.map((col, cIdx) => {
                    const cell = row.cells[col.key];
                    const coord = `${String.fromCharCode(65 + cIdx)}${rowNum}`;
                    const isSelected = selectedCellInfo?.coord === coord;
                    const hi = cell?.highlight;
                    return (
                      <td
                        key={col.key}
                        onClick={() =>
                          setSelectedCellInfo({
                            coord,
                            formula: cell?.formula,
                            value: cell?.value ?? '',
                          })
                        }
                        className={`py-2 px-3 border-b border-r border-slate-800/80 whitespace-nowrap cursor-pointer transition-colors ${
                          col.align === 'right'
                            ? 'text-right tabular-nums'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${cell?.bold || isSum ? 'font-bold text-white' : 'text-slate-200'} ${
                          isSelected ? 'ring-2 ring-inset ring-emerald-400 bg-emerald-500/10' : ''
                        } ${
                          hi === 'rose'
                            ? 'bg-rose-500/15 text-rose-300 font-bold'
                            : hi === 'emerald'
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                            : hi === 'amber'
                            ? 'bg-amber-500/15 text-amber-300 font-bold'
                            : ''
                        }`}
                        title={cell?.formula ? `Formula: ${cell.formula}` : undefined}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          {cell?.formula && (
                            <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">
                              fx
                            </span>
                          )}
                          <span className="ml-auto">
                            {formatCellDisplay(cell, col)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    );
  };

  const renderChart = (heightClass = 'h-60') => {
    if (!activeChart || chartData.length === 0) {
      return (
        <div className="p-8 text-center text-slate-400 text-xs">
          No chart data available for this sheet.
        </div>
      );
    }
    return (
      <div className="p-4 bg-[#0a1017]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>{activeChart.title}</span>
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
            {activeChart.type} Chart
          </span>
        </div>
        <div className={`w-full ${heightClass}`}>
          <ResponsiveContainer width="100%" height="100%">
            {activeChart.type === 'pie' ? (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey={activeChart.valueColumnKeys[0]}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={heightClass.includes('420') ? 130 : 80}
                  label
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            ) : activeChart.type === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                {activeChart.valueColumnKeys.map((vk, i) => (
                  <Line
                    key={vk}
                    type="monotone"
                    dataKey={vk}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2.5}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                {activeChart.valueColumnKeys.map((vk, i) => (
                  <Bar
                    key={vk}
                    dataKey={vk}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="my-3 w-full max-w-full md:max-w-2xl rounded-2xl border border-emerald-700/50 bg-gradient-to-b from-[#0f1922] to-[#0a1118] p-3 md:p-5 shadow-2xl overflow-hidden box-border">
        {/* Top Workbook Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ExcelSpreadsheetIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-bold text-white truncate">
                {currentWorkbook.title}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {currentWorkbook.sheets.length}{' '}
                {currentWorkbook.sheets.length === 1 ? 'Sheet' : 'Sheets'} · Real Formulas (
                <span className="text-emerald-400 font-mono">fx</span>) · .XLSX
              </p>
            </div>
          </div>

          {/* Toggle Table vs Chart View */}
          {activeChart && (
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowChartTab(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                  !showChartTab
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setShowChartTab(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                  showChartTab
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chart</span>
              </button>
            </div>
          )}
        </div>

        {/* Sheet Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-slate-800">
          {currentWorkbook.sheets.map((sh, idx) => {
            const isActive = idx === activeSheetIdx && !showChartTab;
            return (
              <button
                key={sh.id}
                type="button"
                onClick={() => {
                  setActiveSheetIdx(idx);
                  setShowChartTab(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sh.name}
              </button>
            );
          })}
          {activeChart && (
            <button
              type="button"
              onClick={() => setShowChartTab(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                showChartTab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{activeChart.type.toUpperCase()} Chart</span>
            </button>
          )}
        </div>

        {/* Main Workbook Preview Container */}
        <div className="rounded-xl overflow-hidden border border-slate-700/80 bg-[#0c131f] shadow-inner">
          {showChartTab && activeChart ? (
            renderChart('h-60')
          ) : (
            renderSpreadsheetTable()
          )}
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="mt-2.5 py-1.5 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Action Row: Preview Full Grid, Download XLSX, Regenerate, Edit */}
        <div className="mt-3 flex flex-wrap items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => {
              setModalViewTab(showChartTab && activeChart ? 'chart' : 'grid');
              setIsFullModalOpen(true);
            }}
            aria-label="Preview Excel workbook"
            className="flex-1 min-w-[96px] min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label="Download Excel XLSX"
            className="flex-1 min-w-[125px] min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/80 transition-all cursor-pointer disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Building...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded .XLSX</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download .XLSX</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleApplyEdit('Create another sheet')}
            aria-label="Regenerate or expand workbook"
            title="Add Summary/Dashboard Sheet"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsEditOpen((prev) => !prev)}
            aria-label="Edit Excel workbook"
            title="Edit Excel workbook"
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center cursor-pointer ${
              isEditOpen
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Natural-Language Excel Edit Drawer */}
        {isEditOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
            <div className="text-[11px] font-medium text-slate-400">
              Related modifications for this sheet:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dynamicQuickEdits.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyEdit(preset)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-emerald-600/30 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500/50 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyEdit(customEdit);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={customEdit}
                onChange={(e) => setCustomEdit(e.target.value)}
                placeholder={
                  /\b(superman|batman|superhero|hero|character)\b/i.test(`${currentWorkbook.title} ${currentWorkbook.topic || ''}`)
                    ? 'e.g. "of Batman", "Add 5 more characters", or "Sort by power level"'
                    : /\b(game|games|gaming|videogame)\b/i.test(`${currentWorkbook.title} ${currentWorkbook.topic || ''}`)
                    ? 'e.g. "Add 5 more games", "Sort by sales", or "Add genre chart"'
                    : /\b(religion|faith|theology|belief)\b/i.test(`${currentWorkbook.title} ${currentWorkbook.topic || ''}`)
                    ? 'e.g. "Add 5 more world religions", "Sort by adherents", or "Add pie chart"'
                    : 'e.g. "of Batman", "Add 5 more rows", "Sort by column", or "Add a chart"'
                }
                className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!customEdit.trim()}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Apply</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Full-Screen Workbook Inspector Modal (Preview) */}
      {isFullModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-2 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0d1520] border border-slate-800 rounded-t-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <ExcelSpreadsheetIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {currentWorkbook.title}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {currentWorkbook.subtitle}
                </p>
              </div>
            </div>

            {/* Modal Controls: View Tabs + Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Grid vs Chart Toggle inside Preview */}
              <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setModalViewTab('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    modalViewTab === 'grid'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                {activeChart && (
                  <button
                    type="button"
                    onClick={() => setModalViewTab('chart')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      modalViewTab === 'chart'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Chart</span>
                  </button>
                )}
                {activeChart && (
                  <button
                    type="button"
                    onClick={() => setModalViewTab('both')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      modalViewTab === 'both'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Both</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download .XLSX</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sheet tabs bar inside Modal */}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#0a1017] border-x border-b border-slate-800 overflow-x-auto">
            {currentWorkbook.sheets.map((sh, idx) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => {
                  setActiveSheetIdx(idx);
                  if (modalViewTab === 'chart') setModalViewTab('grid');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  idx === activeSheetIdx && modalViewTab !== 'chart'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sh.name}
              </button>
            ))}
            {activeChart && (
              <button
                type="button"
                onClick={() => setModalViewTab('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  modalViewTab === 'chart'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{activeChart.type.toUpperCase()} Chart</span>
              </button>
            )}
          </div>

          <div className="flex-1 bg-[#0b111a] border-x border-b border-slate-800 rounded-b-2xl overflow-auto p-4 space-y-4">
            {modalViewTab === 'chart' ? (
              renderChart('h-[420px]')
            ) : modalViewTab === 'both' ? (
              <div className="space-y-4">
                {activeChart && renderChart('h-[320px]')}
                <div className="border-t border-slate-800 pt-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Spreadsheet Grid Table ({activeSheet.name})</span>
                  </h4>
                  {renderSpreadsheetTable()}
                </div>
              </div>
            ) : (
              renderSpreadsheetTable()
            )}
          </div>
        </div>
      )}
    </>
  );
};
