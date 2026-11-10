import {
  ExcelWorkbookData,
  ExcelSheetData,
  ExcelThemePalette,
  ExcelStyleCategory,
  ExcelChartSpec,
  ExcelRowData,
} from '../types/excel';
export type { ExcelWorkbookData, ExcelSheetData, ExcelThemePalette, ExcelStyleCategory, ExcelChartSpec, ExcelRowData };
import { correctTopicTypos } from './powerpointIntent';

export const EXCEL_THEME_PALETTES: Record<ExcelStyleCategory, ExcelThemePalette> = {
  financial: {
    id: 'financial',
    name: 'Financial Ledger (Emerald & Slate)',
    headerBg: '#064E3B',
    headerText: '#ECFDF5',
    accentHex: '#10B981',
    secondaryHex: '#06B6D4',
    summaryRowBg: '#065F46',
    borderHex: '#1E293B',
  },
  educational: {
    id: 'educational',
    name: 'Academic Register (Royal Blue & Indigo)',
    headerBg: '#1E3A8A',
    headerText: '#EFF6FF',
    accentHex: '#3B82F6',
    secondaryHex: '#8B5CF6',
    summaryRowBg: '#1D4ED8',
    borderHex: '#1E293B',
  },
  business: {
    id: 'business',
    name: 'Executive Analytics (Navy & Cyan)',
    headerBg: '#0F172A',
    headerText: '#F8FAFC',
    accentHex: '#0EA5E9',
    secondaryHex: '#6366F1',
    summaryRowBg: '#1E293B',
    borderHex: '#334155',
  },
  inventory: {
    id: 'inventory',
    name: 'Supply Chain Operations (Amber & Teal)',
    headerBg: '#78350F',
    headerText: '#FEF3C7',
    accentHex: '#F59E0B',
    secondaryHex: '#14B8A6',
    summaryRowBg: '#92400E',
    borderHex: '#1E293B',
  },
  dashboard: {
    id: 'dashboard',
    name: 'KPI Intelligence (Violet & Cyan)',
    headerBg: '#3B0764',
    headerText: '#FAF5FF',
    accentHex: '#A855F7',
    secondaryHex: '#06B6D4',
    summaryRowBg: '#4C1D95',
    borderHex: '#1E293B',
  },
  project: {
    id: 'project',
    name: 'Project Roadmap (Indigo & Rose)',
    headerBg: '#312E81',
    headerText: '#EEF2FF',
    accentHex: '#6366F1',
    secondaryHex: '#EC4899',
    summaryRowBg: '#3730A3',
    borderHex: '#1E293B',
  },
  analytical: {
    id: 'analytical',
    name: 'Quantitative Lab (Teal & Emerald)',
    headerBg: '#134E4A',
    headerText: '#F0FDFA',
    accentHex: '#14B8A6',
    secondaryHex: '#3B82F6',
    summaryRowBg: '#115E59',
    borderHex: '#1E293B',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalist Grid (Charcoal & Cobalt)',
    headerBg: '#18181B',
    headerText: '#FAFAFA',
    accentHex: '#2563EB',
    secondaryHex: '#10B981',
    summaryRowBg: '#27272A',
    borderHex: '#3F3F46',
  },
};

export function detectCurrencyFromPrompt(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/\b(pkr|rupees?|rs\.?)\b/i.test(lower)) return 'PKR ';
  if (/\b(eur|euros?|€)\b/i.test(lower)) return '€';
  if (/\b(gbp|pounds?|£)\b/i.test(lower)) return '£';
  if (/\b(inr|₹)\b/i.test(lower)) return '₹';
  if (/\b(aed|dirhams?)\b/i.test(lower)) return 'AED ';
  return '$';
}

export function generateExcelWorkbook(
  rawTopic: string,
  userPrompt = '',
  wantsChart = false,
  requestedChartType?: 'bar' | 'line' | 'pie' | 'column'
): ExcelWorkbookData {
  const cleanTopic = correctTopicTypos(rawTopic.trim() || 'Financial & Operations Workbook');
  const combined = `${cleanTopic} ${userPrompt}`.toLowerCase();
  const currency = detectCurrencyFromPrompt(combined);

  // 0. SUPERMAN / BATMAN / SUPERHEROES (DC & Marvel Characters)
  const isBatman = /\b(batman|gotham|dark\s+knight|bruce\s+wayne|joker|catwoman)\b/i.test(combined);
  const isSuperman = /\b(superman|man\s+of\s+steel|clark\s+kent|krypton|lex\s+luthor|supergirl)\b/i.test(combined);
  const isSuperhero = isBatman || isSuperman || /\b(superhero|superheroes|justice\s+league|avengers|comic\s+characters?)\b/i.test(combined);

  if (isSuperhero) {
    const palette = isBatman ? EXCEL_THEME_PALETTES.minimal : EXCEL_THEME_PALETTES.project;
    const heroTitle = isBatman ? 'Batman Universe & Gotham Records' : 'Superman Characters & Power Stats';
    const heroSubtitle = isBatman
      ? 'Heroes, Rogues Gallery, Power Levels & Box Office Records'
      : 'Key Characters, Roles, Power Levels & Movie Box Office Records';

    const characters = isBatman
      ? [
          { name: 'Batman (Bruce Wayne)', role: 'Lead Hero', power: 95, year: 1939, origin: 'Gotham City', status: 'Active' },
          { name: 'The Joker', role: 'Archvillain', power: 88, year: 1940, origin: 'Gotham City', status: 'Threat' },
          { name: 'Catwoman (Selina Kyle)', role: 'Antihero', power: 80, year: 1940, origin: 'Gotham City', status: 'Active' },
          { name: 'Jim Gordon', role: 'Police Ally', power: 35, year: 1939, origin: 'GCPD', status: 'Active' },
          { name: 'Nightwing (Dick Grayson)', role: 'Hero Ally', power: 89, year: 1940, origin: 'Blüdhaven', status: 'Active' },
          { name: 'The Riddler', role: 'Supervillain', power: 75, year: 1948, origin: 'Gotham City', status: 'Threat' },
          { name: 'The Penguin', role: 'Crime Boss', power: 70, year: 1941, origin: 'Iceberg Lounge', status: 'Threat' },
          { name: 'Harley Quinn', role: 'Antihero', power: 82, year: 1992, origin: 'Gotham City', status: 'Active' },
          { name: 'Two-Face (Harvey Dent)', role: 'Crime Boss', power: 76, year: 1942, origin: 'Gotham City', status: 'Threat' },
          { name: 'Bane', role: 'Supervillain', power: 94, year: 1993, origin: 'Santa Prisca', status: 'Threat' },
          { name: 'Alfred Pennyworth', role: 'Loyal Butler', power: 40, year: 1943, origin: 'Wayne Manor', status: 'Active' },
        ]
      : [
          { name: 'Superman (Clark Kent)', role: 'Lead Hero', power: 100, year: 1938, origin: 'Krypton', status: 'Active' },
          { name: 'Lois Lane', role: 'Journalist Ally', power: 15, year: 1938, origin: 'Earth', status: 'Active' },
          { name: 'Lex Luthor', role: 'Archvillain Genius', power: 85, year: 1940, origin: 'Earth', status: 'Threat' },
          { name: 'General Zod', role: 'Kryptonian General', power: 96, year: 1961, origin: 'Krypton', status: 'Threat' },
          { name: 'Supergirl (Kara Zor-El)', role: 'Hero Ally', power: 97, year: 1959, origin: 'Krypton', status: 'Active' },
          { name: 'Brainiac', role: 'Alien Conqueror', power: 98, year: 1958, origin: 'Colu', status: 'Threat' },
          { name: 'Doomsday', role: 'Destructive Monster', power: 99, year: 1992, origin: 'Krypton', status: 'Threat' },
          { name: 'Jimmy Olsen', role: 'Photographer Ally', power: 10, year: 1941, origin: 'Earth', status: 'Active' },
          { name: 'Bizarro', role: 'Imperfect Clone', power: 93, year: 1958, origin: 'Earth', status: 'Threat' },
          { name: 'Perry White', role: 'Editor-in-Chief', power: 12, year: 1940, origin: 'Earth', status: 'Active' },
        ];

    const dataRows: ExcelRowData[] = characters.map((c, idx) => {
      const r = idx + 2;
      return {
        id: `hero-row-${r}`,
        cells: {
          character: { value: c.name, format: 'text', bold: true },
          role: { value: c.role, format: 'text' },
          power: {
            value: c.power,
            format: 'number',
            bold: true,
            highlight: c.power >= 95 ? 'emerald' : c.status === 'Threat' ? 'rose' : null,
          },
          year: { value: c.year, format: 'number' },
          origin: { value: c.origin, format: 'text' },
          status: {
            value: c.status,
            format: 'status',
            bold: true,
            highlight: c.status === 'Threat' ? 'rose' : 'emerald',
          },
        },
      };
    });

    const lastHeroRow = characters.length + 1;
    dataRows.push({
      id: 'hero-row-summary',
      isSummaryRow: true,
      cells: {
        character: { value: 'Summary & Averages', format: 'text', bold: true },
        role: { value: `${characters.length} Total Characters`, format: 'text' },
        power: {
          value: +(characters.reduce((s, x) => s + x.power, 0) / characters.length).toFixed(1),
          formula: `=AVERAGE(C2:C${lastHeroRow})`,
          format: 'number',
          bold: true,
        },
        year: {
          value: characters[0].year,
          formula: `=MIN(D2:D${lastHeroRow})`,
          format: 'number',
        },
        origin: { value: 'Top Power Level:', format: 'text', bold: true },
        status: {
          value: Math.max(...characters.map((x) => x.power)),
          formula: `=MAX(C2:C${lastHeroRow})`,
          format: 'number',
          bold: true,
        },
      },
    });

    const movies = isBatman
      ? [
          { title: 'Batman', year: 1989, budget: 35, boxOffice: 411, rating: 7.5 },
          { title: 'Batman Returns', year: 1992, budget: 80, boxOffice: 266, rating: 7.1 },
          { title: 'Batman Begins', year: 2005, budget: 150, boxOffice: 373, rating: 8.2 },
          { title: 'The Dark Knight', year: 2008, budget: 185, boxOffice: 1006, rating: 9.0 },
          { title: 'The Dark Knight Rises', year: 2012, budget: 250, boxOffice: 1081, rating: 8.4 },
          { title: 'The Batman', year: 2022, budget: 200, boxOffice: 772, rating: 7.8 },
        ]
      : [
          { title: 'Superman', year: 1978, budget: 55, boxOffice: 300, rating: 8.7 },
          { title: 'Superman II', year: 1980, budget: 54, boxOffice: 190, rating: 7.9 },
          { title: 'Superman Returns', year: 2006, budget: 223, boxOffice: 391, rating: 6.5 },
          { title: 'Man of Steel', year: 2013, budget: 225, boxOffice: 668, rating: 7.4 },
          { title: 'Batman v Superman', year: 2016, budget: 250, boxOffice: 873, rating: 6.8 },
          { title: 'Justice League', year: 2021, budget: 70, boxOffice: 657, rating: 8.0 },
        ];

    const movieRows: ExcelRowData[] = movies.map((m, idx) => {
      const r = idx + 2;
      return {
        id: `movie-${r}`,
        cells: {
          title: { value: m.title, format: 'text', bold: true },
          year: { value: m.year, format: 'number' },
          budget: { value: m.budget, format: 'currency' },
          boxOffice: { value: m.boxOffice, format: 'currency', bold: true, highlight: m.boxOffice >= 600 ? 'emerald' : null },
          profit: {
            value: m.boxOffice - m.budget,
            formula: `=D${r}-C${r}`,
            format: 'currency',
            bold: true,
          },
          rating: { value: m.rating, format: 'number', highlight: m.rating >= 8.0 ? 'emerald' : null },
        },
      };
    });

    const lastMovieRow = movies.length + 1;
    movieRows.push({
      id: 'movie-summary',
      isSummaryRow: true,
      cells: {
        title: { value: 'Totals & Averages', format: 'text', bold: true },
        year: { value: `${movies.length} Films`, format: 'text' },
        budget: {
          value: movies.reduce((s, x) => s + x.budget, 0),
          formula: `=SUM(C2:C${lastMovieRow})`,
          format: 'currency',
          bold: true,
        },
        boxOffice: {
          value: movies.reduce((s, x) => s + x.boxOffice, 0),
          formula: `=SUM(D2:D${lastMovieRow})`,
          format: 'currency',
          bold: true,
        },
        profit: {
          value: movies.reduce((s, x) => s + (x.boxOffice - x.budget), 0),
          formula: `=SUM(E2:E${lastMovieRow})`,
          format: 'currency',
          bold: true,
        },
        rating: {
          value: +(movies.reduce((s, x) => s + x.rating, 0) / movies.length).toFixed(1),
          formula: `=AVERAGE(F2:F${lastMovieRow})`,
          format: 'number',
          bold: true,
        },
      },
    });

    return {
      id: `xlsx-${Date.now()}`,
      title: heroTitle,
      subtitle: heroSubtitle,
      topic: cleanTopic,
      styleCategory: isBatman ? 'minimal' : 'project',
      palette,
      currencySymbol: '$',
      sheets: [
        {
          id: 'sheet-characters',
          name: isBatman ? 'Gotham Characters' : 'Characters & Powers',
          freezeHeader: true,
          columns: [
            { key: 'character', header: 'Character Name', width: 25, align: 'left', format: 'text' },
            { key: 'role', header: 'Character Role', width: 20, align: 'left', format: 'text' },
            { key: 'power', header: 'Power Level (1-100)', width: 18, align: 'right', format: 'number' },
            { key: 'year', header: 'First Year', width: 14, align: 'center', format: 'number' },
            { key: 'origin', header: 'Origin / Home', width: 18, align: 'left', format: 'text' },
            { key: 'status', header: 'Status', width: 14, align: 'center', format: 'status' },
          ],
          rows: dataRows,
        },
        {
          id: 'sheet-movies',
          name: 'Movies & Box Office',
          freezeHeader: true,
          columns: [
            { key: 'title', header: 'Movie Title', width: 25, align: 'left', format: 'text' },
            { key: 'year', header: 'Release Year', width: 14, align: 'center', format: 'number' },
            { key: 'budget', header: 'Budget ($M)', width: 15, align: 'right', format: 'currency' },
            { key: 'boxOffice', header: 'Box Office ($M)', width: 16, align: 'right', format: 'currency' },
            { key: 'profit', header: 'Gross Profit ($M)', width: 16, align: 'right', format: 'currency' },
            { key: 'rating', header: 'Rating (1-10)', width: 14, align: 'right', format: 'number' },
          ],
          rows: movieRows,
        },
      ],
      charts: [
        {
          id: 'chart-hero-power',
          title: isBatman ? 'Gotham City Character Power & Skill Ratings' : 'Superman Characters Power Level Ratings',
          type: requestedChartType || 'bar',
          sheetName: isBatman ? 'Gotham Characters' : 'Characters & Powers',
          labelColumnKey: 'character',
          valueColumnKeys: ['power'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // 1. STUDENT MARKS / GRADES SHEET
  if (/\b(student\s+marks|marksheet|marks\s+sheet|grades?|exam\s+results?|report\s+card|academic\s+scores?)\b/i.test(combined)) {
    const palette = EXCEL_THEME_PALETTES.educational;
    const students = [
      { name: 'Ayaan Khan', math: 94, science: 91, english: 88, computer: 96 },
      { name: 'Sara Ahmed', math: 87, science: 89, english: 92, computer: 90 },
      { name: 'Zainab Ali', math: 78, science: 82, english: 85, computer: 84 },
      { name: 'Hamza Tariq', math: 46, science: 49, english: 52, computer: 45 },
      { name: 'Bilal Hassan', math: 91, science: 88, english: 84, computer: 93 },
      { name: 'Fatima Noor', math: 83, science: 86, english: 89, computer: 87 },
      { name: 'Omar Farooq', math: 42, science: 47, english: 44, computer: 50 },
      { name: 'Hiba Siddiqui', math: 96, science: 95, english: 93, computer: 98 },
    ];

    const dataRows: ExcelRowData[] = students.map((st, idx) => {
      const r = idx + 2;
      const total = st.math + st.science + st.english + st.computer;
      const pct = +(total / 4).toFixed(1);
      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'F';
      const isLow = pct < 50;

      return {
        id: `row-${r}`,
        cells: {
          student: { value: st.name, format: 'text', bold: true },
          math: { value: st.math, format: 'number' },
          science: { value: st.science, format: 'number' },
          english: { value: st.english, format: 'number' },
          computer: { value: st.computer, format: 'number' },
          total: {
            value: total,
            formula: `=SUM(B${r}:E${r})`,
            format: 'number',
            bold: true,
          },
          percentage: {
            value: pct,
            formula: `=ROUND((F${r}/400)*100,1)`,
            format: 'percentage',
            bold: true,
            highlight: isLow ? 'rose' : pct >= 90 ? 'emerald' : null,
          },
          grade: {
            value: grade,
            formula: `=IF(G${r}>=90,"A+",IF(G${r}>=80,"A",IF(G${r}>=70,"B",IF(G${r}>=50,"C","F"))))`,
            format: 'status',
            bold: true,
            highlight: isLow ? 'rose' : grade.startsWith('A') ? 'emerald' : null,
          },
        },
      };
    });

    const lastDataRow = students.length + 1;
    const avgRowNum = lastDataRow + 1;

    dataRows.push({
      id: `row-avg`,
      isSummaryRow: true,
      cells: {
        student: { value: 'Class Average', format: 'text', bold: true },
        math: {
          value: +(students.reduce((s, x) => s + x.math, 0) / students.length).toFixed(1),
          formula: `=AVERAGE(B2:B${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        science: {
          value: +(students.reduce((s, x) => s + x.science, 0) / students.length).toFixed(1),
          formula: `=AVERAGE(C2:C${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        english: {
          value: +(students.reduce((s, x) => s + x.english, 0) / students.length).toFixed(1),
          formula: `=AVERAGE(D2:D${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        computer: {
          value: +(students.reduce((s, x) => s + x.computer, 0) / students.length).toFixed(1),
          formula: `=AVERAGE(E2:E${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        total: {
          value: +(
            students.reduce((s, x) => s + x.math + x.science + x.english + x.computer, 0) /
            students.length
          ).toFixed(1),
          formula: `=AVERAGE(F2:F${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        percentage: {
          value: +(
            students.reduce((s, x) => s + (x.math + x.science + x.english + x.computer) / 4, 0) /
            students.length
          ).toFixed(1),
          formula: `=AVERAGE(G2:G${lastDataRow})`,
          format: 'percentage',
          bold: true,
        },
        grade: {
          value: 'PASS',
          formula: `=IF(G${avgRowNum}>=50,"PASS","REVIEW")`,
          format: 'status',
          bold: true,
        },
      },
    });

    const summarySheet: ExcelSheetData = {
      id: 'sheet-summary',
      name: 'Summary',
      freezeHeader: true,
      columns: [
        { key: 'metric', header: 'Class Performance Metric', width: 28, align: 'left', format: 'text' },
        { key: 'value', header: 'Computed Value', width: 18, align: 'right', format: 'number' },
        { key: 'formulaRef', header: 'Formula Reference', width: 28, align: 'left', format: 'text' },
      ],
      rows: [
        {
          id: 'sum-1',
          cells: {
            metric: { value: 'Total Students Evaluated', bold: true },
            value: { value: students.length, formula: `=COUNTA('Student Marks'!A2:A${lastDataRow})`, bold: true },
            formulaRef: { value: `COUNTA('Student Marks'!A2:A${lastDataRow})` },
          },
        },
        {
          id: 'sum-2',
          cells: {
            metric: { value: 'Highest Total Score', bold: true },
            value: { value: 382, formula: `=MAX('Student Marks'!F2:F${lastDataRow})`, bold: true, highlight: 'emerald' },
            formulaRef: { value: `MAX('Student Marks'!F2:F${lastDataRow})` },
          },
        },
        {
          id: 'sum-3',
          cells: {
            metric: { value: 'Lowest Total Score', bold: true },
            value: { value: 183, formula: `=MIN('Student Marks'!F2:F${lastDataRow})`, bold: true, highlight: 'rose' },
            formulaRef: { value: `MIN('Student Marks'!F2:F${lastDataRow})` },
          },
        },
        {
          id: 'sum-4',
          cells: {
            metric: { value: 'Students Scoring >= 80%', bold: true },
            value: { value: 6, formula: `=COUNTIF('Student Marks'!G2:G${lastDataRow},">=80")`, bold: true, highlight: 'emerald' },
            formulaRef: { value: `COUNTIF('Student Marks'!G2:G${lastDataRow},">=80")` },
          },
        },
        {
          id: 'sum-5',
          cells: {
            metric: { value: 'Students Below 50% (Needs Support)', bold: true },
            value: { value: 2, formula: `=COUNTIF('Student Marks'!G2:G${lastDataRow},"<50")`, bold: true, highlight: 'rose' },
            formulaRef: { value: `COUNTIF('Student Marks'!G2:G${lastDataRow},"<50")` },
          },
        },
      ],
    };

    const charts: ExcelChartSpec[] = [
      {
        id: 'chart-marks',
        title: 'Student Total Marks & Percentage Comparison',
        type: requestedChartType || 'bar',
        sheetName: 'Student Marks',
        labelColumnKey: 'student',
        valueColumnKeys: ['math', 'science', 'computer'],
      },
    ];

    return {
      id: `xlsx-${Date.now()}`,
      title: 'Student Marks & Gradebook Sheet',
      subtitle: 'Automated Sums, Percentages, IF Grades & Class Summary',
      topic: cleanTopic,
      styleCategory: 'educational',
      palette,
      currencySymbol: currency,
      sheets: [
        {
          id: 'sheet-marks',
          name: 'Student Marks',
          freezeHeader: true,
          columns: [
            { key: 'student', header: 'Student Name', width: 22, align: 'left', format: 'text' },
            { key: 'math', header: 'Mathematics', width: 14, align: 'right', format: 'number' },
            { key: 'science', header: 'Science', width: 14, align: 'right', format: 'number' },
            { key: 'english', header: 'English', width: 14, align: 'right', format: 'number' },
            { key: 'computer', header: 'Computer Sci', width: 14, align: 'right', format: 'number' },
            { key: 'total', header: 'Total (400)', width: 15, align: 'right', format: 'number' },
            { key: 'percentage', header: 'Percentage', width: 15, align: 'right', format: 'percentage' },
            { key: 'grade', header: 'Grade', width: 12, align: 'center', format: 'status' },
          ],
          rows: dataRows,
          conditionalRules: [
            {
              columnKey: 'percentage',
              operator: 'lt',
              targetValue: 50,
              color: 'rose',
              label: 'Below 50% Highlighted',
            },
          ],
        },
        summarySheet,
      ],
      charts,
      createdAt: new Date().toISOString(),
    };
  }

  // 2. CATS, PETS & ANIMAL REGISTRY WORKBOOK
  if (/\b(cat|cats|kitten|kittens|pet|pets|feline|dog|dogs|puppy|puppies|animal|animals|veterinary|vet)\b/i.test(combined)) {
    const palette = EXCEL_THEME_PALETTES.dashboard;
    const cats = [
      { name: 'Luna', breed: 'British Shorthair', age: 3, weight: 4.2, foodGrams: 65, monthlyCost: 55, vaccinated: 'Yes', status: 'Healthy' },
      { name: 'Milo', breed: 'Maine Coon', age: 2, weight: 7.8, foodGrams: 110, monthlyCost: 85, vaccinated: 'Yes', status: 'Healthy' },
      { name: 'Oliver', breed: 'Siamese', age: 4, weight: 3.9, foodGrams: 60, monthlyCost: 50, vaccinated: 'Yes', status: 'Healthy' },
      { name: 'Leo', breed: 'Bengal', age: 1, weight: 4.5, foodGrams: 75, monthlyCost: 65, vaccinated: 'Yes', status: 'Checkup Due' },
      { name: 'Bella', breed: 'Persian', age: 5, weight: 3.6, foodGrams: 55, monthlyCost: 75, vaccinated: 'Yes', status: 'Grooming Due' },
      { name: 'Charlie', breed: 'Ragdoll', age: 2, weight: 5.8, foodGrams: 90, monthlyCost: 60, vaccinated: 'Yes', status: 'Healthy' },
      { name: 'Simba', breed: 'Scottish Fold', age: 3, weight: 4.1, foodGrams: 65, monthlyCost: 55, vaccinated: 'Yes', status: 'Healthy' },
      { name: 'Cleo', breed: 'Sphynx', age: 4, weight: 3.4, foodGrams: 70, monthlyCost: 80, vaccinated: 'Yes', status: 'Healthy' },
    ];

    const dataRows: ExcelRowData[] = cats.map((cat, idx) => {
      const r = idx + 2;
      return {
        id: `cat-${r}`,
        cells: {
          name: { value: cat.name, format: 'text', bold: true },
          breed: { value: cat.breed, format: 'text' },
          age: { value: cat.age, format: 'number' },
          weight: { value: cat.weight, format: 'number' },
          foodGrams: { value: cat.foodGrams, format: 'number' },
          monthlyCost: { value: cat.monthlyCost, format: 'currency', bold: true },
          vaccinated: { value: cat.vaccinated, format: 'status', bold: true, highlight: 'emerald' },
          status: {
            value: cat.status,
            format: 'status',
            bold: true,
            highlight: cat.status === 'Healthy' ? 'emerald' : 'amber',
          },
        },
      };
    });

    const lastDataRow = cats.length + 1;
    dataRows.push({
      id: 'cat-avg',
      isSummaryRow: true,
      cells: {
        name: { value: 'Average & Total', format: 'text', bold: true },
        breed: { value: `${cats.length} Registered Cats`, format: 'text' },
        age: {
          value: +(cats.reduce((s, c) => s + c.age, 0) / cats.length).toFixed(1),
          formula: `=AVERAGE(C2:C${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        weight: {
          value: +(cats.reduce((s, c) => s + c.weight, 0) / cats.length).toFixed(1),
          formula: `=AVERAGE(D2:D${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        foodGrams: {
          value: +(cats.reduce((s, c) => s + c.foodGrams, 0) / cats.length).toFixed(1),
          formula: `=AVERAGE(E2:E${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        monthlyCost: {
          value: cats.reduce((s, c) => s + c.monthlyCost, 0),
          formula: `=SUM(F2:F${lastDataRow})`,
          format: 'currency',
          bold: true,
        },
        vaccinated: { value: '100% Up-To-Date', format: 'text', bold: true },
        status: { value: 'Active', format: 'status', bold: true },
      },
    });

    const suppliesSheet: ExcelSheetData = {
      id: 'sheet-supplies',
      name: 'Nutrition & Supplies',
      freezeHeader: true,
      columns: [
        { key: 'item', header: 'Care Item / Service', width: 26, align: 'left', format: 'text' },
        { key: 'category', header: 'Category', width: 16, align: 'left', format: 'text' },
        { key: 'quantity', header: 'Monthly Qty', width: 14, align: 'right', format: 'number' },
        { key: 'unitCost', header: 'Unit Cost', width: 14, align: 'right', format: 'currency' },
        { key: 'totalCost', header: 'Total Cost', width: 16, align: 'right', format: 'currency' },
      ],
      rows: [
        {
          id: 'sup-1',
          cells: {
            item: { value: 'Premium Dry Cat Kibble', bold: true },
            category: { value: 'Nutrition' },
            quantity: { value: 4 },
            unitCost: { value: 32, format: 'currency' },
            totalCost: { value: 128, formula: '=C2*D2', format: 'currency', bold: true },
          },
        },
        {
          id: 'sup-2',
          cells: {
            item: { value: 'Gourmet Wet Food Pouches', bold: true },
            category: { value: 'Nutrition' },
            quantity: { value: 24 },
            unitCost: { value: 2.5, format: 'currency' },
            totalCost: { value: 60, formula: '=C3*D3', format: 'currency', bold: true },
          },
        },
        {
          id: 'sup-3',
          cells: {
            item: { value: 'Clumping Natural Bentonite Litter', bold: true },
            category: { value: 'Hygiene' },
            quantity: { value: 3 },
            unitCost: { value: 18, format: 'currency' },
            totalCost: { value: 54, formula: '=C4*D4', format: 'currency', bold: true },
          },
        },
        {
          id: 'sup-4',
          cells: {
            item: { value: 'Veterinary Check & Vaccines', bold: true },
            category: { value: 'Healthcare' },
            quantity: { value: 1 },
            unitCost: { value: 85, format: 'currency' },
            totalCost: { value: 85, formula: '=C5*D5', format: 'currency', bold: true },
          },
        },
        {
          id: 'sup-5',
          cells: {
            item: { value: 'Flea & Parasite Prevention', bold: true },
            category: { value: 'Healthcare' },
            quantity: { value: 2 },
            unitCost: { value: 22, format: 'currency' },
            totalCost: { value: 44, formula: '=C6*D6', format: 'currency', bold: true },
          },
        },
        {
          id: 'sup-6',
          cells: {
            item: { value: 'Interactive Scratchers & Toys', bold: true },
            category: { value: 'Enrichment' },
            quantity: { value: 2 },
            unitCost: { value: 16, format: 'currency' },
            totalCost: { value: 32, formula: '=C7*D7', format: 'currency', bold: true },
          },
        },
        {
          id: 'sup-total',
          isSummaryRow: true,
          cells: {
            item: { value: 'TOTAL MONTHLY BUDGET', bold: true },
            category: { value: 'All Categories' },
            quantity: { value: 36, formula: '=SUM(C2:C7)' },
            unitCost: { value: '-' },
            totalCost: { value: 403, formula: '=SUM(E2:E7)', format: 'currency', bold: true },
          },
        },
      ],
    };

    return {
      id: `xlsx-${Date.now()}`,
      title: 'Cat Breeds & Health Care Registry',
      subtitle: '8 Cats Registered • Breeds, Weights, Nutrition & Monthly Care Budget',
      topic: cleanTopic,
      styleCategory: 'dashboard',
      palette,
      currencySymbol: currency,
      sheets: [
        {
          id: 'sheet-cats',
          name: 'Cat Registry & Care Log',
          freezeHeader: true,
          columns: [
            { key: 'name', header: 'Cat Name', width: 18, align: 'left', format: 'text' },
            { key: 'breed', header: 'Breed', width: 22, align: 'left', format: 'text' },
            { key: 'age', header: 'Age (Yrs)', width: 12, align: 'right', format: 'number' },
            { key: 'weight', header: 'Weight (kg)', width: 14, align: 'right', format: 'number' },
            { key: 'foodGrams', header: 'Daily Food (g)', width: 15, align: 'right', format: 'number' },
            { key: 'monthlyCost', header: 'Monthly Care', width: 16, align: 'right', format: 'currency' },
            { key: 'vaccinated', header: 'Vaccinated', width: 14, align: 'center', format: 'status' },
            { key: 'status', header: 'Health Status', width: 16, align: 'center', format: 'status' },
          ],
          rows: dataRows,
        },
        suppliesSheet,
      ],
      charts: [
        {
          id: 'chart-cat-weight',
          title: 'Cat Weight (kg) Comparison by Breed',
          type: requestedChartType || 'bar',
          sheetName: 'Cat Registry & Care Log',
          labelColumnKey: 'name',
          valueColumnKeys: ['weight'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // 3. WORLD RELIGIONS & DEMOGRAPHICS WORKBOOK
  if (
    /\b(religion|religions|faith|faiths|theology|belief|beliefs|islam|christianity|hinduism|buddhism|judaism|sikhism|religious|adherent|adherents|scripture)\b/i.test(
      combined
    )
  ) {
    const palette = EXCEL_THEME_PALETTES.project;
    const religions = [
      {
        name: 'Christianity',
        adherents: 2400,
        sharePct: 30.8,
        scripture: 'Holy Bible (Old & New Testament)',
        era: '1st Century CE',
        region: 'Americas, Europe & Sub-Saharan Africa',
        holySites: 'Jerusalem, Vatican City, Bethlehem',
        worship: 'Church / Cathedral',
        status: 'Major World Faith',
      },
      {
        name: 'Islam',
        adherents: 1900,
        sharePct: 24.4,
        scripture: 'Holy Quran (Al-Qur’an)',
        era: '7th Century CE',
        region: 'Middle East, North Africa & Asia-Pacific',
        holySites: 'Mecca, Medina, Al-Aqsa (Jerusalem)',
        worship: 'Mosque / Masjid',
        status: 'Major World Faith',
      },
      {
        name: 'Hinduism',
        adherents: 1200,
        sharePct: 15.4,
        scripture: 'The Vedas, Upanishads & Bhagavad Gita',
        era: 'c. 1500 BCE',
        region: 'South Asia (India & Nepal)',
        holySites: 'Varanasi, Ayodhya, Haridwar, Badrinath',
        worship: 'Mandir / Temple',
        status: 'Major World Faith',
      },
      {
        name: 'Buddhism',
        adherents: 520,
        sharePct: 6.7,
        scripture: 'Tripitaka (Pali Canon) & Sutras',
        era: '6th Century BCE',
        region: 'East, Southeast & South Asia',
        holySites: 'Bodh Gaya, Lumbini, Sarnath, Kushinagar',
        worship: 'Temple / Pagoda / Vihara',
        status: 'Major World Faith',
      },
      {
        name: 'Folk & Traditional Religions',
        adherents: 430,
        sharePct: 5.5,
        scripture: 'Oral Traditions & Ancestral Lore',
        era: 'Ancient Eras',
        region: 'Sub-Saharan Africa, China & Indigenous Americas',
        holySites: 'Ancestral Groves & Sacred Mountain Shrines',
        worship: 'Sacred Shrines & Nature Altars',
        status: 'Indigenous Traditions',
      },
      {
        name: 'Sikhism',
        adherents: 30,
        sharePct: 0.4,
        scripture: 'Guru Granth Sahib',
        era: '15th Century CE',
        region: 'South Asia (Punjab) & Global Diaspora',
        holySites: 'Harmandir Sahib (Golden Temple), Nankana Sahib',
        worship: 'Gurdwara',
        status: 'Dharmic Tradition',
      },
      {
        name: 'Judaism',
        adherents: 15,
        sharePct: 0.2,
        scripture: 'Tanakh (Torah) & Talmud',
        era: 'c. 1800 BCE',
        region: 'Israel & North America',
        holySites: 'Western Wall (Jerusalem), Hebron',
        worship: 'Synagogue',
        status: 'Abrahamic Faith',
      },
      {
        name: 'Shinto & Taoism',
        adherents: 12,
        sharePct: 0.2,
        scripture: 'Kojiki & Tao Te Ching',
        era: 'Ancient Eras',
        region: 'East Asia (Japan & China)',
        holySites: 'Ise Grand Shrine, Wudang Mountains',
        worship: 'Jinja (Shrine) / Daoguan',
        status: 'East Asian Tradition',
      },
    ];

    const dataRows: ExcelRowData[] = religions.map((rel, idx) => {
      const r = idx + 2;
      return {
        id: `rel-${r}`,
        cells: {
          religion: { value: rel.name, format: 'text', bold: true },
          adherents: { value: rel.adherents, format: 'number', bold: true },
          sharePct: {
            value: rel.sharePct,
            formula: `=ROUND((B${r}/7800)*100,1)`,
            format: 'percentage',
            bold: true,
            highlight: rel.sharePct >= 15 ? 'emerald' : null,
          },
          sacredText: { value: rel.scripture, format: 'text' },
          originEra: { value: rel.era, format: 'text' },
          primaryRegion: { value: rel.region, format: 'text' },
          holySites: { value: rel.holySites, format: 'text' },
          status: {
            value: rel.status,
            format: 'status',
            bold: true,
            highlight: 'emerald',
          },
        },
      };
    });

    const lastDataRow = religions.length + 1;
    dataRows.push({
      id: 'rel-summary',
      isSummaryRow: true,
      cells: {
        religion: { value: 'Global Adherents Total & Average', format: 'text', bold: true },
        adherents: {
          value: religions.reduce((s, r) => s + r.adherents, 0),
          formula: `=SUM(B2:B${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        sharePct: {
          value: +(religions.reduce((s, r) => s + r.sharePct, 0)).toFixed(1),
          formula: `=SUM(C2:C${lastDataRow})`,
          format: 'percentage',
          bold: true,
        },
        sacredText: { value: `${religions.length} Traditions Cataloged`, format: 'text' },
        originEra: { value: 'Historical Spectrum', format: 'text' },
        primaryRegion: { value: 'Worldwide Scope', format: 'text' },
        holySites: { value: 'Global Heritage', format: 'text' },
        status: { value: 'Documented', format: 'status', bold: true },
      },
    });

    const traditionsSheet: ExcelSheetData = {
      id: 'sheet-traditions',
      name: 'Sacred Observances & Places of Worship',
      freezeHeader: true,
      columns: [
        { key: 'tradition', header: 'Tradition / Faith', width: 22, align: 'left', format: 'text' },
        { key: 'coreBelief', header: 'Core Theological Tenet', width: 32, align: 'left', format: 'text' },
        { key: 'majorHolidays', header: 'Major Sacred Observances', width: 30, align: 'left', format: 'text' },
        { key: 'worshipPlace', header: 'House of Worship', width: 22, align: 'left', format: 'text' },
        { key: 'scriptureLanguage', header: 'Scripture Languages', width: 22, align: 'left', format: 'text' },
        { key: 'growthDecade', header: 'Projected Growth (%/Decade)', width: 22, align: 'right', format: 'percentage' },
      ],
      rows: [
        {
          id: 'trad-1',
          cells: {
            tradition: { value: 'Christianity', bold: true },
            coreBelief: { value: 'Monotheism, Holy Trinity, Salvation through Jesus Christ' },
            majorHolidays: { value: 'Easter, Christmas, Pentecost' },
            worshipPlace: { value: 'Church, Cathedral, Chapel' },
            scriptureLanguage: { value: 'Hebrew, Aramaic, Ancient Greek' },
            growthDecade: { value: 1.2, format: 'percentage', bold: true },
          },
        },
        {
          id: 'trad-2',
          cells: {
            tradition: { value: 'Islam', bold: true },
            coreBelief: { value: 'Tawhid (Absolute Oneness of Allah), Prophethood of Muhammad' },
            majorHolidays: { value: 'Eid al-Fitr, Eid al-Adha, Ramadan' },
            worshipPlace: { value: 'Mosque (Masjid), Musalla' },
            scriptureLanguage: { value: 'Classical Arabic (Fus’ha)' },
            growthDecade: { value: 1.8, format: 'percentage', bold: true, highlight: 'emerald' },
          },
        },
        {
          id: 'trad-3',
          cells: {
            tradition: { value: 'Hinduism', bold: true },
            coreBelief: { value: 'Dharma, Karma, Samsara, Moksha, Brahman as Supreme Reality' },
            majorHolidays: { value: 'Diwali, Holi, Navratri, Maha Shivaratri' },
            worshipPlace: { value: 'Mandir (Hindu Temple), Home Altar' },
            scriptureLanguage: { value: 'Sanskrit' },
            growthDecade: { value: 1.1, format: 'percentage', bold: true },
          },
        },
        {
          id: 'trad-4',
          cells: {
            tradition: { value: 'Buddhism', bold: true },
            coreBelief: { value: 'Four Noble Truths, Eightfold Path, Nirvana, Compassion' },
            majorHolidays: { value: 'Vesak (Buddha Day), Asalha Puja' },
            worshipPlace: { value: 'Vihara, Pagoda, Buddhist Temple, Wat' },
            scriptureLanguage: { value: 'Pali, Sanskrit, Classical Tibetan' },
            growthDecade: { value: 0.6, format: 'percentage', bold: true },
          },
        },
        {
          id: 'trad-5',
          cells: {
            tradition: { value: 'Sikhism', bold: true },
            coreBelief: { value: 'Ik Onkar (One Supreme Reality), Equality, Honest Living, Seva' },
            majorHolidays: { value: 'Vaisakhi, Gurpurab, Bandi Chhor Divas' },
            worshipPlace: { value: 'Gurdwara' },
            scriptureLanguage: { value: 'Gurmukhi (Punjabi)' },
            growthDecade: { value: 0.9, format: 'percentage', bold: true },
          },
        },
        {
          id: 'trad-6',
          cells: {
            tradition: { value: 'Judaism', bold: true },
            coreBelief: { value: 'Ethical Monotheism, Covenant between God and the Jewish People' },
            majorHolidays: { value: 'Passover (Pesach), Yom Kippur, Rosh Hashanah' },
            worshipPlace: { value: 'Synagogue, Beit Midrash' },
            scriptureLanguage: { value: 'Biblical & Modern Hebrew, Aramaic' },
            growthDecade: { value: 0.5, format: 'percentage', bold: true },
          },
        },
      ],
    };

    const charts: ExcelChartSpec[] = [
      {
        id: 'chart-religion-adherents',
        title: 'Global World Religion Adherents (Millions)',
        type: requestedChartType || 'bar',
        sheetName: 'World Religions Overview',
        labelColumnKey: 'religion',
        valueColumnKeys: ['adherents'],
      },
    ];

    return {
      id: `xlsx-${Date.now()}`,
      title: 'World Religions & Global Adherents Demographics',
      subtitle: 'Comprehensive Demographic Statistics, Sacred Scriptures, Origin Eras & Holy Sites with Automated Formulas',
      topic: cleanTopic,
      styleCategory: 'project',
      palette,
      currencySymbol: '',
      sheets: [
        {
          id: 'sheet-religions',
          name: 'World Religions Overview',
          freezeHeader: true,
          columns: [
            { key: 'religion', header: 'Religion / Tradition', width: 24, align: 'left', format: 'text' },
            { key: 'adherents', header: 'Estimated Adherents (M)', width: 20, align: 'right', format: 'number' },
            { key: 'sharePct', header: 'Global Share %', width: 16, align: 'right', format: 'percentage' },
            { key: 'sacredText', header: 'Major Sacred Scripture', width: 28, align: 'left', format: 'text' },
            { key: 'originEra', header: 'Historical Origin', width: 18, align: 'center', format: 'text' },
            { key: 'primaryRegion', header: 'Primary Geographic Scope', width: 28, align: 'left', format: 'text' },
            { key: 'holySites', header: 'Major Holy Sites', width: 26, align: 'left', format: 'text' },
            { key: 'status', header: 'Classification', width: 18, align: 'center', format: 'status' },
          ],
          rows: dataRows,
          conditionalRules: [
            {
              columnKey: 'adherents',
              operator: 'gt',
              targetValue: 499,
              color: 'emerald',
              label: 'Major Tradition (≥ 500M)',
            },
          ],
        },
        traditionsSheet,
      ],
      charts,
      createdAt: new Date().toISOString(),
    };
  }

  // 4. VIDEO GAMES & GAMING BENCHMARK WORKBOOK
  if (
    /\b(games?|gaming|videogames?|video\s+games?|gamers?|esports|game\s+sales|best\s+selling\s+games|steam|playstation|xbox|nintendo)\b/i.test(
      combined
    )
  ) {
    const palette = EXCEL_THEME_PALETTES.dashboard;
    const games = [
      {
        title: 'Minecraft',
        genre: 'Sandbox / Survival',
        studio: 'Mojang Studios / Xbox',
        year: 2011,
        salesM: 300,
        metacritic: 93,
        status: 'All-Time #1 Best-Seller',
      },
      {
        title: 'Grand Theft Auto V',
        genre: 'Action-Adventure',
        studio: 'Rockstar Games',
        year: 2013,
        salesM: 195,
        metacritic: 97,
        status: 'Global Blockbuster',
      },
      {
        title: 'Tetris (EA / Modern)',
        genre: 'Puzzle Classic',
        studio: 'EA / Tetris Holding',
        year: 2006,
        salesM: 100,
        metacritic: 95,
        status: 'Historic Legend',
      },
      {
        title: 'Wii Sports',
        genre: 'Sports Simulation',
        studio: 'Nintendo EAD',
        year: 2006,
        salesM: 83,
        metacritic: 80,
        status: 'Family Classic',
      },
      {
        title: 'PUBG: Battlegrounds',
        genre: 'Battle Royale',
        studio: 'PUBG Studios / Krafton',
        year: 2017,
        salesM: 75,
        metacritic: 86,
        status: 'Global Phenomenon',
      },
      {
        title: 'Red Dead Redemption 2',
        genre: 'Open World Western',
        studio: 'Rockstar Games',
        year: 2018,
        salesM: 61,
        metacritic: 97,
        status: 'Critical Masterpiece',
      },
      {
        title: 'The Witcher 3: Wild Hunt',
        genre: 'Action RPG',
        studio: 'CD Projekt Red',
        year: 2015,
        salesM: 50,
        metacritic: 93,
        status: 'Universal Acclaim',
      },
      {
        title: 'Elden Ring',
        genre: 'Action RPG / Souls',
        studio: 'FromSoftware / Bandai',
        year: 2022,
        salesM: 25,
        metacritic: 96,
        status: 'Game of the Year',
      },
    ];

    const dataRows: ExcelRowData[] = games.map((g, idx) => {
      const r = idx + 2;
      return {
        id: `game-${r}`,
        cells: {
          title: { value: g.title, format: 'text', bold: true },
          genre: { value: g.genre, format: 'text' },
          studio: { value: g.studio, format: 'text' },
          year: { value: g.year, format: 'number' },
          salesM: { value: g.salesM, format: 'number', bold: true, highlight: g.salesM >= 100 ? 'emerald' : null },
          metacritic: {
            value: g.metacritic,
            format: 'number',
            bold: true,
            highlight: g.metacritic >= 95 ? 'emerald' : null,
          },
          status: {
            value: g.status,
            format: 'status',
            bold: true,
            highlight: 'emerald',
          },
        },
      };
    });

    const lastDataRow = games.length + 1;
    dataRows.push({
      id: 'game-summary',
      isSummaryRow: true,
      cells: {
        title: { value: 'Total & Average Industry Metric', format: 'text', bold: true },
        genre: { value: `${games.length} Best-Selling Titles`, format: 'text' },
        studio: { value: 'Top World Studios', format: 'text' },
        year: { value: '-', format: 'text' },
        salesM: {
          value: games.reduce((s, g) => s + g.salesM, 0),
          formula: `=SUM(E2:E${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        metacritic: {
          value: +(games.reduce((s, g) => s + g.metacritic, 0) / games.length).toFixed(1),
          formula: `=AVERAGE(F2:F${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        status: { value: 'Benchmark Complete', format: 'status', bold: true },
      },
    });

    const genresSheet: ExcelSheetData = {
      id: 'sheet-genres',
      name: 'Genre Market Share',
      freezeHeader: true,
      columns: [
        { key: 'genre', header: 'Genre Category', width: 22, align: 'left', format: 'text' },
        { key: 'marketShare', header: 'Industry Market Share %', width: 22, align: 'right', format: 'percentage' },
        { key: 'annualGrowth', header: 'Annual Revenue Growth %', width: 22, align: 'right', format: 'percentage' },
        { key: 'leadFranchise', header: 'Flagship Representative Franchise', width: 28, align: 'left', format: 'text' },
      ],
      rows: [
        {
          id: 'gen-1',
          cells: {
            genre: { value: 'Action-Adventure / Open World', bold: true },
            marketShare: { value: 28.5, format: 'percentage', bold: true },
            annualGrowth: { value: 7.2, format: 'percentage', bold: true },
            leadFranchise: { value: 'Grand Theft Auto, Red Dead, Zelda' },
          },
        },
        {
          id: 'gen-2',
          cells: {
            genre: { value: 'Action RPG & Soulsborne', bold: true },
            marketShare: { value: 22.0, format: 'percentage', bold: true },
            annualGrowth: { value: 9.8, format: 'percentage', bold: true, highlight: 'emerald' },
            leadFranchise: { value: 'The Witcher, Elden Ring, Skyrim' },
          },
        },
        {
          id: 'gen-3',
          cells: {
            genre: { value: 'Shooters & Battle Royale', bold: true },
            marketShare: { value: 19.5, format: 'percentage', bold: true },
            annualGrowth: { value: 5.4, format: 'percentage', bold: true },
            leadFranchise: { value: 'PUBG, Call of Duty, Fortnite' },
          },
        },
        {
          id: 'gen-4',
          cells: {
            genre: { value: 'Sandbox & Survival Crafting', bold: true },
            marketShare: { value: 16.0, format: 'percentage', bold: true },
            annualGrowth: { value: 8.1, format: 'percentage', bold: true },
            leadFranchise: { value: 'Minecraft, Terraria, Rust' },
          },
        },
      ],
    };

    const charts: ExcelChartSpec[] = [
      {
        id: 'chart-games-sales',
        title: 'All-Time Best-Selling Video Games (Global Sales in Millions)',
        type: requestedChartType || 'bar',
        sheetName: 'All-Time Best-Selling Games',
        labelColumnKey: 'title',
        valueColumnKeys: ['salesM'],
      },
    ];

    return {
      id: `xlsx-${Date.now()}`,
      title: 'Video Games & Global Best-Sellers Benchmark',
      subtitle: 'All-Time Franchise Sales, Metacritic Scores, Studio Catalogs & Automated Formulas',
      topic: cleanTopic,
      styleCategory: 'dashboard',
      palette,
      currencySymbol: '',
      sheets: [
        {
          id: 'sheet-games',
          name: 'All-Time Best-Selling Games',
          freezeHeader: true,
          columns: [
            { key: 'title', header: 'Game Title', width: 26, align: 'left', format: 'text' },
            { key: 'genre', header: 'Genre / Category', width: 22, align: 'left', format: 'text' },
            { key: 'studio', header: 'Studio / Publisher', width: 22, align: 'left', format: 'text' },
            { key: 'year', header: 'Release Year', width: 14, align: 'center', format: 'number' },
            { key: 'salesM', header: 'Global Sales (M)', width: 18, align: 'right', format: 'number' },
            { key: 'metacritic', header: 'Metacritic Score', width: 18, align: 'right', format: 'number' },
            { key: 'status', header: 'Industry Status', width: 20, align: 'center', format: 'status' },
          ],
          rows: dataRows,
          conditionalRules: [
            {
              columnKey: 'salesM',
              operator: 'gt',
              targetValue: 99,
              color: 'emerald',
              label: 'Over 100M Copies Sold',
            },
          ],
        },
        genresSheet,
      ],
      charts,
      createdAt: new Date().toISOString(),
    };
  }

  // 5. ATTENDANCE TRACKER
  if (/\b(attendance|present|absent|roll\s+call|daily\s+log)\b/i.test(combined)) {
    const palette = EXCEL_THEME_PALETTES.analytical;
    const roster = [
      { id: 'ST-101', name: 'Ayaan Khan', mon: 'P', tue: 'P', wed: 'P', thu: 'P', fri: 'P', present: 5 },
      { id: 'ST-102', name: 'Sara Ahmed', mon: 'P', tue: 'P', wed: 'A', thu: 'P', fri: 'P', present: 4 },
      { id: 'ST-103', name: 'Zainab Ali', mon: 'P', tue: 'P', wed: 'P', thu: 'P', fri: 'P', present: 5 },
      { id: 'ST-104', name: 'Hamza Tariq', mon: 'A', tue: 'P', wed: 'A', thu: 'A', fri: 'P', present: 2 },
      { id: 'ST-105', name: 'Bilal Hassan', mon: 'P', tue: 'P', wed: 'P', thu: 'A', fri: 'P', present: 4 },
      { id: 'ST-106', name: 'Fatima Noor', mon: 'P', tue: 'P', wed: 'P', thu: 'P', fri: 'P', present: 5 },
      { id: 'ST-107', name: 'Omar Farooq', mon: 'A', tue: 'A', wed: 'P', thu: 'A', fri: 'P', present: 2 },
    ];

    const rows: ExcelRowData[] = roster.map((st, idx) => {
      const r = idx + 2;
      const absent = 5 - st.present;
      const pct = +(st.present / 5 * 100).toFixed(0);
      const status = pct >= 75 ? 'Good Standing' : 'Low Attendance';
      return {
        id: `att-${r}`,
        cells: {
          studentId: { value: st.id, format: 'text' },
          student: { value: st.name, format: 'text', bold: true },
          mon: { value: st.mon, format: 'status', highlight: st.mon === 'A' ? 'rose' : 'emerald' },
          tue: { value: st.tue, format: 'status', highlight: st.tue === 'A' ? 'rose' : 'emerald' },
          wed: { value: st.wed, format: 'status', highlight: st.wed === 'A' ? 'rose' : 'emerald' },
          thu: { value: st.thu, format: 'status', highlight: st.thu === 'A' ? 'rose' : 'emerald' },
          fri: { value: st.fri, format: 'status', highlight: st.fri === 'A' ? 'rose' : 'emerald' },
          daysPresent: {
            value: st.present,
            formula: `=COUNTIF(C${r}:G${r},"P")`,
            format: 'number',
            bold: true,
          },
          daysAbsent: {
            value: absent,
            formula: `=COUNTIF(C${r}:G${r},"A")`,
            format: 'number',
          },
          attendancePct: {
            value: pct,
            formula: `=ROUND((H${r}/5)*100,1)`,
            format: 'percentage',
            bold: true,
            highlight: pct < 50 ? 'rose' : pct >= 80 ? 'emerald' : 'amber',
          },
          status: {
            value: status,
            formula: `=IF(J${r}>=75,"Good Standing","Low Attendance")`,
            format: 'status',
            bold: true,
            highlight: pct < 75 ? 'rose' : 'emerald',
          },
        },
      };
    });

    const lastRow = roster.length + 1;
    rows.push({
      id: 'att-summary',
      isSummaryRow: true,
      cells: {
        studentId: { value: 'TOTAL', bold: true },
        student: { value: 'Weekly Attendance Average', bold: true },
        mon: { value: '-' },
        tue: { value: '-' },
        wed: { value: '-' },
        thu: { value: '-' },
        fri: { value: '-' },
        daysPresent: {
          value: +(roster.reduce((s, x) => s + x.present, 0) / roster.length).toFixed(1),
          formula: `=AVERAGE(H2:H${lastRow})`,
          format: 'number',
          bold: true,
        },
        daysAbsent: {
          value: +(roster.reduce((s, x) => s + (5 - x.present), 0) / roster.length).toFixed(1),
          formula: `=AVERAGE(I2:I${lastRow})`,
          format: 'number',
          bold: true,
        },
        attendancePct: {
          value: +(roster.reduce((s, x) => s + (x.present / 5) * 100, 0) / roster.length).toFixed(1),
          formula: `=AVERAGE(J2:J${lastRow})`,
          format: 'percentage',
          bold: true,
        },
        status: { value: 'ACTIVE', bold: true },
      },
    });

    return {
      id: `xlsx-${Date.now()}`,
      title: 'Student Attendance Tracker',
      subtitle: 'COUNTIF Present/Absent Formulas & Attendance Percentage Alerts',
      topic: cleanTopic,
      styleCategory: 'analytical',
      palette,
      currencySymbol: currency,
      sheets: [
        {
          id: 'sheet-attendance',
          name: 'Attendance Log',
          freezeHeader: true,
          columns: [
            { key: 'studentId', header: 'ID', width: 10, align: 'center', format: 'text' },
            { key: 'student', header: 'Student Name', width: 20, align: 'left', format: 'text' },
            { key: 'mon', header: 'Mon', width: 8, align: 'center', format: 'status' },
            { key: 'tue', header: 'Tue', width: 8, align: 'center', format: 'status' },
            { key: 'wed', header: 'Wed', width: 8, align: 'center', format: 'status' },
            { key: 'thu', header: 'Thu', width: 8, align: 'center', format: 'status' },
            { key: 'fri', header: 'Fri', width: 8, align: 'center', format: 'status' },
            { key: 'daysPresent', header: 'Present', width: 11, align: 'right', format: 'number' },
            { key: 'daysAbsent', header: 'Absent', width: 11, align: 'right', format: 'number' },
            { key: 'attendancePct', header: 'Attendance %', width: 15, align: 'right', format: 'percentage' },
            { key: 'status', header: 'Standing', width: 16, align: 'center', format: 'status' },
          ],
          rows,
        },
      ],
      charts: [
        {
          id: 'chart-attendance',
          title: 'Student Attendance Percentage (%)',
          type: requestedChartType || 'bar',
          sheetName: 'Attendance Log',
          labelColumnKey: 'student',
          valueColumnKeys: ['attendancePct'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // 3. INVENTORY MANAGEMENT
  if (/\b(inventory|stock|sku|warehouse|reorder|products?\s+list)\b/i.test(combined)) {
    const palette = EXCEL_THEME_PALETTES.inventory;
    const items = [
      { sku: 'SKU-401', product: 'Wireless Mechanical Keyboard', qty: 48, reorder: 20, price: 85 },
      { sku: 'SKU-402', product: '27" 4K IPS Studio Monitor', qty: 14, reorder: 15, price: 340 },
      { sku: 'SKU-403', product: 'USB-C Docking Station Pro', qty: 62, reorder: 25, price: 110 },
      { sku: 'SKU-404', product: 'Ergonomic Mesh Office Chair', qty: 9, reorder: 12, price: 260 },
      { sku: 'SKU-405', product: 'Noise-Canceling Headset', qty: 35, reorder: 18, price: 145 },
      { sku: 'SKU-406', product: '1TB NVMe Portable SSD', qty: 80, reorder: 30, price: 95 },
    ];

    const rows: ExcelRowData[] = items.map((it, idx) => {
      const r = idx + 2;
      const val = it.qty * it.price;
      const needsReorder = it.qty <= it.reorder;
      return {
        id: `inv-${r}`,
        cells: {
          sku: { value: it.sku, format: 'text' },
          product: { value: it.product, format: 'text', bold: true },
          quantity: {
            value: it.qty,
            format: 'number',
            highlight: needsReorder ? 'rose' : null,
          },
          reorderLevel: { value: it.reorder, format: 'number' },
          unitPrice: { value: it.price, format: 'currency' },
          stockValue: {
            value: val,
            formula: `=C${r}*E${r}`,
            format: 'currency',
            bold: true,
          },
          status: {
            value: needsReorder ? 'REORDER NOW' : 'In Stock',
            formula: `=IF(C${r}<=D${r},"REORDER NOW","In Stock")`,
            format: 'status',
            bold: true,
            highlight: needsReorder ? 'rose' : 'emerald',
          },
        },
      };
    });

    const lastRow = items.length + 1;
    const totalQty = items.reduce((s, x) => s + x.qty, 0);
    const totalVal = items.reduce((s, x) => s + x.qty * x.price, 0);

    rows.push({
      id: 'inv-total',
      isSummaryRow: true,
      cells: {
        sku: { value: 'TOTAL', bold: true },
        product: { value: 'Total Warehouse Valuation', bold: true },
        quantity: { value: totalQty, formula: `=SUM(C2:C${lastRow})`, format: 'number', bold: true },
        reorderLevel: { value: '-', format: 'text' },
        unitPrice: {
          value: +(items.reduce((s, x) => s + x.price, 0) / items.length).toFixed(2),
          formula: `=AVERAGE(E2:E${lastRow})`,
          format: 'currency',
          bold: true,
        },
        stockValue: { value: totalVal, formula: `=SUM(F2:F${lastRow})`, format: 'currency', bold: true },
        status: { value: 'ACTIVE', bold: true },
      },
    });

    return {
      id: `xlsx-${Date.now()}`,
      title: 'Inventory & Stock Valuation Workbook',
      subtitle: 'Real-Time Stock Value Formulas & Reorder Alerts',
      topic: cleanTopic,
      styleCategory: 'inventory',
      palette,
      currencySymbol: currency,
      sheets: [
        {
          id: 'sheet-inventory',
          name: 'Inventory Stock',
          freezeHeader: true,
          columns: [
            { key: 'sku', header: 'SKU', width: 12, align: 'center', format: 'text' },
            { key: 'product', header: 'Product Name', width: 28, align: 'left', format: 'text' },
            { key: 'quantity', header: 'Quantity', width: 12, align: 'right', format: 'number' },
            { key: 'reorderLevel', header: 'Reorder Level', width: 14, align: 'right', format: 'number' },
            { key: 'unitPrice', header: 'Unit Price', width: 14, align: 'right', format: 'currency' },
            { key: 'stockValue', header: 'Stock Value', width: 16, align: 'right', format: 'currency' },
            { key: 'status', header: 'Reorder Status', width: 16, align: 'center', format: 'status' },
          ],
          rows,
        },
      ],
      charts: [
        {
          id: 'chart-inv',
          title: 'Stock Valuation by Product',
          type: requestedChartType || 'bar',
          sheetName: 'Inventory Stock',
          labelColumnKey: 'product',
          valueColumnKeys: ['stockValue'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // 4. SALES & REVENUE SPREADSHEET
  if (/\b(sales|revenue|orders|quarterly|monthly\s+sales|product\s+sales)\b/i.test(combined)) {
    const palette = EXCEL_THEME_PALETTES.business;
    const salesData = [
      { date: '2026-09-01', product: 'Enterprise Cloud Suite', qty: 18, price: 450 },
      { date: '2026-09-05', product: 'AI Analytics Pro License', qty: 32, price: 290 },
      { date: '2026-09-10', product: 'Cybersecurity Shield Pack', qty: 24, price: 350 },
      { date: '2026-09-14', product: 'Data Automation Module', qty: 41, price: 195 },
      { date: '2026-09-19', product: 'Custom API Integration', qty: 12, price: 680 },
      { date: '2026-09-24', product: 'Team Collaboration Hub', qty: 54, price: 150 },
    ];

    let running = 0;
    const rows: ExcelRowData[] = salesData.map((s, idx) => {
      const r = idx + 2;
      const rev = s.qty * s.price;
      running += rev;
      return {
        id: `sale-${r}`,
        cells: {
          date: { value: s.date, format: 'date' },
          product: { value: s.product, format: 'text', bold: true },
          quantity: { value: s.qty, format: 'number' },
          price: { value: s.price, format: 'currency' },
          revenue: {
            value: rev,
            formula: `=C${r}*D${r}`,
            format: 'currency',
            bold: true,
            highlight: rev >= 8500 ? 'emerald' : null,
          },
          runningTotal: {
            value: running,
            formula: idx === 0 ? `=E2` : `=F${r - 1}+E${r}`,
            format: 'currency',
          },
        },
      };
    });

    const lastRow = salesData.length + 1;
    const totalQty = salesData.reduce((acc, x) => acc + x.qty, 0);

    rows.push({
      id: 'sale-total',
      isSummaryRow: true,
      cells: {
        date: { value: 'TOTAL', bold: true },
        product: { value: 'Total Sales & Revenue', bold: true },
        quantity: { value: totalQty, formula: `=SUM(C2:C${lastRow})`, format: 'number', bold: true },
        price: {
          value: +(salesData.reduce((acc, x) => acc + x.price, 0) / salesData.length).toFixed(2),
          formula: `=AVERAGE(D2:D${lastRow})`,
          format: 'currency',
          bold: true,
        },
        revenue: { value: running, formula: `=SUM(E2:E${lastRow})`, format: 'currency', bold: true },
        runningTotal: { value: running, formula: `=MAX(F2:F${lastRow})`, format: 'currency', bold: true },
      },
    });

    return {
      id: `xlsx-${Date.now()}`,
      title: 'Sales & Revenue Analytics Workbook',
      subtitle: 'Automated Revenue Formulas, Running Totals & Visual Chart',
      topic: cleanTopic,
      styleCategory: 'business',
      palette,
      currencySymbol: currency,
      sheets: [
        {
          id: 'sheet-sales',
          name: 'Sales Data',
          freezeHeader: true,
          columns: [
            { key: 'date', header: 'Date', width: 14, align: 'center', format: 'date' },
            { key: 'product', header: 'Product / Service', width: 26, align: 'left', format: 'text' },
            { key: 'quantity', header: 'Quantity', width: 12, align: 'right', format: 'number' },
            { key: 'price', header: 'Unit Price', width: 14, align: 'right', format: 'currency' },
            { key: 'revenue', header: 'Revenue', width: 16, align: 'right', format: 'currency' },
            { key: 'runningTotal', header: 'Running Total', width: 16, align: 'right', format: 'currency' },
          ],
          rows,
        },
        {
          id: 'sheet-sales-summary',
          name: 'Executive Summary',
          freezeHeader: true,
          columns: [
            { key: 'kpi', header: 'Sales KPI', width: 26, align: 'left', format: 'text' },
            { key: 'amount', header: 'Value', width: 18, align: 'right', format: 'currency' },
            { key: 'formulaUsed', header: 'Excel Formula', width: 28, align: 'left', format: 'text' },
          ],
          rows: [
            {
              id: 'kpi-1',
              cells: {
                kpi: { value: 'Gross Total Revenue', bold: true },
                amount: { value: running, formula: `=SUM('Sales Data'!E2:E${lastRow})`, format: 'currency', bold: true, highlight: 'emerald' },
                formulaUsed: { value: `=SUM('Sales Data'!E2:E${lastRow})` },
              },
            },
            {
              id: 'kpi-2',
              cells: {
                kpi: { value: 'Average Deal Revenue', bold: true },
                amount: { value: +(running / salesData.length).toFixed(2), formula: `=AVERAGE('Sales Data'!E2:E${lastRow})`, format: 'currency', bold: true },
                formulaUsed: { value: `=AVERAGE('Sales Data'!E2:E${lastRow})` },
              },
            },
            {
              id: 'kpi-3',
              cells: {
                kpi: { value: 'Peak Single Order Revenue', bold: true },
                amount: { value: 9280, formula: `=MAX('Sales Data'!E2:E${lastRow})`, format: 'currency', bold: true },
                formulaUsed: { value: `=MAX('Sales Data'!E2:E${lastRow})` },
              },
            },
          ],
        },
      ],
      charts: [
        {
          id: 'chart-sales',
          title: 'Revenue by Product Line',
          type: requestedChartType || 'column',
          sheetName: 'Sales Data',
          labelColumnKey: 'product',
          valueColumnKeys: ['revenue'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // 6. DYNAMIC CUSTOM TOPIC WORKBOOK (For ANY arbitrary user topic, e.g. Space, Cricket, History, Nature, etc.)
  const isFinancial = /\b(expense|expenses|budget|spending|cost|corporate\s+spend|financial|revenue|profit|invoice|payroll|accounting)\b/i.test(combined);

  if (!isFinancial) {
    const palette = EXCEL_THEME_PALETTES.dashboard;
    const dynamicItems = [
      { name: `${cleanTopic} Primary Core`, category: 'Tier 1 / Alpha', metric1: 94, metric2: 88, status: 'Active / Optimal' },
      { name: `${cleanTopic} Advanced Standard`, category: 'Tier 1 / Beta', metric1: 89, metric2: 85, status: 'Active / Optimal' },
      { name: `${cleanTopic} Special Edition`, category: 'Tier 2 / Pro', metric1: 82, metric2: 79, status: 'Verified' },
      { name: `${cleanTopic} Essential Unit`, category: 'Core Base', metric1: 76, metric2: 74, status: 'Verified' },
      { name: `${cleanTopic} Regional Variant`, category: 'Regional', metric1: 71, metric2: 68, status: 'Under Review' },
      { name: `${cleanTopic} Historical Archive`, category: 'Heritage', metric1: 65, metric2: 63, status: 'Archived' },
      { name: `${cleanTopic} Innovation Pilot`, category: 'Experimental', metric1: 91, metric2: 95, status: 'Active / Optimal' },
    ];

    const dataRows: ExcelRowData[] = dynamicItems.map((item, idx) => {
      const r = idx + 2;
      const compositeScore = +(item.metric1 * 0.6 + item.metric2 * 0.4).toFixed(1);
      return {
        id: `item-${r}`,
        cells: {
          name: { value: item.name, format: 'text', bold: true },
          category: { value: item.category, format: 'text' },
          metric1: { value: item.metric1, format: 'number' },
          metric2: { value: item.metric2, format: 'number' },
          totalScore: {
            value: compositeScore,
            formula: `=ROUND((C${r}*0.6)+(D${r}*0.4),1)`,
            format: 'number',
            bold: true,
            highlight: compositeScore >= 85 ? 'emerald' : null,
          },
          status: {
            value: item.status,
            format: 'status',
            bold: true,
            highlight: item.status.includes('Optimal') ? 'emerald' : 'amber',
          },
        },
      };
    });

    const lastDataRow = dynamicItems.length + 1;
    dataRows.push({
      id: 'custom-summary',
      isSummaryRow: true,
      cells: {
        name: { value: 'Average & Total Summary', format: 'text', bold: true },
        category: { value: `${dynamicItems.length} Records Cataloged`, format: 'text' },
        metric1: {
          value: +(dynamicItems.reduce((s, x) => s + x.metric1, 0) / dynamicItems.length).toFixed(1),
          formula: `=AVERAGE(C2:C${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        metric2: {
          value: +(dynamicItems.reduce((s, x) => s + x.metric2, 0) / dynamicItems.length).toFixed(1),
          formula: `=AVERAGE(D2:D${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        totalScore: {
          value: +(dynamicItems.reduce((s, x) => s + (x.metric1 * 0.6 + x.metric2 * 0.4), 0) / dynamicItems.length).toFixed(1),
          formula: `=AVERAGE(E2:E${lastDataRow})`,
          format: 'number',
          bold: true,
        },
        status: { value: 'Complete', format: 'status', bold: true },
      },
    });

    const safeSheetPrefix = cleanTopic.slice(0, 18);
    const summarySheet: ExcelSheetData = {
      id: 'sheet-custom-summary',
      name: `${safeSheetPrefix} Summary`,
      freezeHeader: true,
      columns: [
        { key: 'metric', header: 'Statistical Indicator', width: 26, align: 'left', format: 'text' },
        { key: 'value', header: 'Computed Metric', width: 18, align: 'right', format: 'number' },
        { key: 'reference', header: 'Formula Reference', width: 28, align: 'left', format: 'text' },
      ],
      rows: [
        {
          id: 'csum-1',
          cells: {
            metric: { value: 'Total Cataloged Entries', bold: true },
            value: { value: dynamicItems.length, formula: `=COUNTA('${safeSheetPrefix} Data'!A2:A${lastDataRow})`, bold: true },
            reference: { value: `COUNTA(A2:A${lastDataRow})` },
          },
        },
        {
          id: 'csum-2',
          cells: {
            metric: { value: 'Peak Evaluated Score', bold: true },
            value: { value: 92.6, formula: `=MAX('${safeSheetPrefix} Data'!E2:E${lastDataRow})`, bold: true, highlight: 'emerald' },
            reference: { value: `MAX(E2:E${lastDataRow})` },
          },
        },
        {
          id: 'csum-3',
          cells: {
            metric: { value: 'Minimum Evaluated Score', bold: true },
            value: { value: 64.2, formula: `=MIN('${safeSheetPrefix} Data'!E2:E${lastDataRow})`, bold: true },
            reference: { value: `MIN(E2:E${lastDataRow})` },
          },
        },
      ],
    };

    return {
      id: `xlsx-${Date.now()}`,
      title: `${cleanTopic} Structured Workbook`,
      subtitle: 'Custom Entity Records, Statistical Benchmarks & Automated Formulas',
      topic: cleanTopic,
      styleCategory: 'dashboard',
      palette,
      currencySymbol: '',
      sheets: [
        {
          id: 'sheet-custom-data',
          name: `${safeSheetPrefix} Data`,
          freezeHeader: true,
          columns: [
            { key: 'name', header: `${cleanTopic} Subject / Record`, width: 28, align: 'left', format: 'text' },
            { key: 'category', header: 'Classification / Tier', width: 20, align: 'left', format: 'text' },
            { key: 'metric1', header: 'Primary Rating (100)', width: 18, align: 'right', format: 'number' },
            { key: 'metric2', header: 'Secondary Rating (100)', width: 18, align: 'right', format: 'number' },
            { key: 'totalScore', header: 'Composite Index', width: 18, align: 'right', format: 'number' },
            { key: 'status', header: 'Operational Status', width: 18, align: 'center', format: 'status' },
          ],
          rows: dataRows,
        },
        summarySheet,
      ],
      charts: [
        {
          id: 'chart-custom-metric',
          title: `${cleanTopic} Composite Index Comparison`,
          type: requestedChartType || 'bar',
          sheetName: `${safeSheetPrefix} Data`,
          labelColumnKey: 'name',
          valueColumnKeys: ['totalScore'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // 7. DYNAMIC RANDOM TOPIC SPREADSHEET (Simple words, accessible vocabulary for any arbitrary topic)
  if (!/\b(budget|finance|revenue|expense|expenses|spending|salary|profit|invoice|ledger|cost|bills?)\b/i.test(combined)) {
    const palette = EXCEL_THEME_PALETTES.dashboard;
    const items = [
      { name: `${cleanTopic} Item 1`, category: 'Standard', score: 92, count: 45, year: 2021, status: 'Active' },
      { name: `${cleanTopic} Item 2`, category: 'Standard', score: 85, count: 70, year: 2022, status: 'Active' },
      { name: `${cleanTopic} Item 3`, category: 'Special', score: 78, count: 30, year: 2020, status: 'Pending' },
      { name: `${cleanTopic} Item 4`, category: 'Special', score: 96, count: 120, year: 2023, status: 'Active' },
      { name: `${cleanTopic} Item 5`, category: 'Review', score: 64, count: 15, year: 2019, status: 'Review' },
      { name: `${cleanTopic} Item 6`, category: 'Standard', score: 88, count: 85, year: 2022, status: 'Active' },
      { name: `${cleanTopic} Item 7`, category: 'Special', score: 91, count: 95, year: 2024, status: 'Active' },
      { name: `${cleanTopic} Item 8`, category: 'Review', score: 73, count: 40, year: 2021, status: 'Pending' },
    ];

    const dataRows: ExcelRowData[] = items.map((it, idx) => {
      const r = idx + 2;
      return {
        id: `row-${r}`,
        cells: {
          name: { value: it.name, format: 'text', bold: true },
          category: { value: it.category, format: 'text' },
          score: {
            value: it.score,
            format: 'number',
            bold: true,
            highlight: it.score >= 90 ? 'emerald' : it.score < 70 ? 'amber' : null,
          },
          count: { value: it.count, format: 'number' },
          year: { value: it.year, format: 'number' },
          status: { value: it.status, format: 'status', bold: true },
        },
      };
    });

    const lastRow = items.length + 1;
    dataRows.push({
      id: 'row-summary',
      isSummaryRow: true,
      cells: {
        name: { value: 'Summary & Totals', format: 'text', bold: true },
        category: { value: `${items.length} Entries`, format: 'text' },
        score: {
          value: +(items.reduce((s, x) => s + x.score, 0) / items.length).toFixed(1),
          formula: `=AVERAGE(C2:C${lastRow})`,
          format: 'number',
          bold: true,
        },
        count: {
          value: items.reduce((s, x) => s + x.count, 0),
          formula: `=SUM(D2:D${lastRow})`,
          format: 'number',
          bold: true,
        },
        year: { value: 'Top Score:', format: 'text', bold: true },
        status: {
          value: Math.max(...items.map((x) => x.score)),
          formula: `=MAX(C2:C${lastRow})`,
          format: 'number',
          bold: true,
        },
      },
    });

    return {
      id: `xlsx-${Date.now()}`,
      title: `${cleanTopic} Overview & Records`,
      subtitle: `Clear Records, Simple Metrics, and Summary Formulas for ${cleanTopic}`,
      topic: cleanTopic,
      styleCategory: 'dashboard',
      palette,
      currencySymbol: currency || '$',
      sheets: [
        {
          id: 'sheet-main',
          name: `${cleanTopic.slice(0, 20)} Records`,
          freezeHeader: true,
          columns: [
            { key: 'name', header: `${cleanTopic} Name`, width: 26, align: 'left', format: 'text' },
            { key: 'category', header: 'Category', width: 18, align: 'left', format: 'text' },
            { key: 'score', header: 'Score (1-100)', width: 16, align: 'right', format: 'number' },
            { key: 'count', header: 'Quantity / Count', width: 18, align: 'right', format: 'number' },
            { key: 'year', header: 'Year', width: 14, align: 'center', format: 'number' },
            { key: 'status', header: 'Status', width: 14, align: 'center', format: 'status' },
          ],
          rows: dataRows,
        },
        {
          id: 'sheet-summary',
          name: 'Category Summary',
          freezeHeader: true,
          columns: [
            { key: 'category', header: 'Category Group', width: 22, align: 'left', format: 'text' },
            { key: 'itemCount', header: 'Total Items', width: 16, align: 'right', format: 'number' },
            { key: 'avgScore', header: 'Average Score', width: 16, align: 'right', format: 'number' },
          ],
          rows: [
            {
              id: 'cat-1',
              cells: {
                category: { value: 'Standard', bold: true },
                itemCount: { value: 3, formula: `=COUNTIF('sheet-main'!B2:B${lastRow},"Standard")`, format: 'number', bold: true },
                avgScore: { value: 88.3, formula: `=AVERAGEIF('sheet-main'!B2:B${lastRow},"Standard",'sheet-main'!C2:C${lastRow})`, format: 'number' },
              },
            },
            {
              id: 'cat-2',
              cells: {
                category: { value: 'Special', bold: true },
                itemCount: { value: 3, formula: `=COUNTIF('sheet-main'!B2:B${lastRow},"Special")`, format: 'number', bold: true },
                avgScore: { value: 88.3, formula: `=AVERAGEIF('sheet-main'!B2:B${lastRow},"Special",'sheet-main'!C2:C${lastRow})`, format: 'number' },
              },
            },
            {
              id: 'cat-3',
              cells: {
                category: { value: 'Review', bold: true },
                itemCount: { value: 2, formula: `=COUNTIF('sheet-main'!B2:B${lastRow},"Review")`, format: 'number', bold: true },
                avgScore: { value: 68.5, formula: `=AVERAGEIF('sheet-main'!B2:B${lastRow},"Review",'sheet-main'!C2:C${lastRow})`, format: 'number' },
              },
            },
          ],
        },
      ],
      charts: [
        {
          id: 'chart-main-score',
          title: `${cleanTopic} Score Comparison`,
          type: requestedChartType || 'bar',
          sheetName: `${cleanTopic.slice(0, 20)} Records`,
          labelColumnKey: 'name',
          valueColumnKeys: ['score'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // 8. EXPENSES & BUDGET TRACKER (Only when topic is specifically financial)
  const palette = EXCEL_THEME_PALETTES.financial;
  const expenseItems = [
    { date: '2026-09-02', desc: 'Software Subscriptions & Licenses', category: 'Software', method: 'Corporate Card', amount: 350 },
    { date: '2026-09-05', desc: 'High-Speed Workspace Connectivity', category: 'Utilities', method: 'Bank Transfer', amount: 145 },
    { date: '2026-09-09', desc: 'Office Supplies & Materials', category: 'Supplies', method: 'Corporate Card', amount: 220 },
    { date: '2026-09-12', desc: 'Team Professional Development', category: 'Training', method: 'Invoice', amount: 395 },
    { date: '2026-09-16', desc: 'Marketing & Digital Outreach', category: 'Marketing', method: 'Corporate Card', amount: 550 },
    { date: '2026-09-21', desc: 'Equipment Maintenance & Hardware', category: 'Operations', method: 'Bank Transfer', amount: 280 },
    { date: '2026-09-25', desc: 'Workspace Electricity & Services', category: 'Utilities', method: 'Bank Transfer', amount: 210 },
  ];

  let runningBalance = 0;
  const rows: ExcelRowData[] = expenseItems.map((item, idx) => {
    const r = idx + 2;
    runningBalance += item.amount;
    return {
      id: `exp-${r}`,
      cells: {
        date: { value: item.date, format: 'date' },
        description: { value: item.desc, format: 'text', bold: true },
        category: { value: item.category, format: 'text' },
        paymentMethod: { value: item.method, format: 'text' },
        amount: {
          value: item.amount,
          format: 'currency',
          bold: true,
          highlight: item.amount >= 500 ? 'amber' : null,
        },
        runningTotal: {
          value: runningBalance,
          formula: idx === 0 ? `=E2` : `=F${r - 1}+E${r}`,
          format: 'currency',
        },
      },
    };
  });

  const lastRow = expenseItems.length + 1;
  rows.push({
    id: 'exp-total',
    isSummaryRow: true,
    cells: {
      date: { value: 'TOTAL', bold: true },
      description: { value: 'Total Monthly Expenses', bold: true },
      category: { value: `${expenseItems.length} Entries`, formula: `=COUNTA(C2:C${lastRow})&" Entries"` },
      paymentMethod: { value: 'Average Expense:', bold: true },
      amount: {
        value: runningBalance,
        formula: `=SUM(E2:E${lastRow})`,
        format: 'currency',
        bold: true,
      },
      runningTotal: {
        value: +(runningBalance / expenseItems.length).toFixed(2),
        formula: `=AVERAGE(E2:E${lastRow})`,
        format: 'currency',
        bold: true,
      },
    },
  });

  const workbookTitle = 'Monthly Expenses & Budget Tracker';

  return {
    id: `xlsx-${Date.now()}`,
    title: workbookTitle,
    subtitle: 'Automated SUM, AVERAGE & Running Total Formulas with Summary Sheet',
    topic: cleanTopic,
    styleCategory: 'financial',
    palette,
    currencySymbol: currency,
    sheets: [
      {
        id: 'sheet-expenses',
        name: 'Expenses Log',
        freezeHeader: true,
        columns: [
          { key: 'date', header: 'Date', width: 14, align: 'center', format: 'date' },
          { key: 'description', header: 'Description', width: 30, align: 'left', format: 'text' },
          { key: 'category', header: 'Category', width: 16, align: 'left', format: 'text' },
          { key: 'paymentMethod', header: 'Payment Method', width: 18, align: 'left', format: 'text' },
          { key: 'amount', header: 'Amount', width: 15, align: 'right', format: 'currency' },
          { key: 'runningTotal', header: 'Running Total', width: 16, align: 'right', format: 'currency' },
        ],
        rows,
      },
      {
        id: 'sheet-category-summary',
        name: 'Category Summary',
        freezeHeader: true,
        columns: [
          { key: 'category', header: 'Category', width: 22, align: 'left', format: 'text' },
          { key: 'totalAmount', header: 'Category Total', width: 18, align: 'right', format: 'currency' },
          { key: 'sharePct', header: '% of Total Spend', width: 18, align: 'right', format: 'percentage' },
        ],
        rows: [
          {
            id: 'cat-1',
            cells: {
              category: { value: 'Marketing', bold: true },
              totalAmount: { value: 650, formula: `=SUMIF('Expenses Log'!C2:C${lastRow},"Marketing",'Expenses Log'!E2:E${lastRow})`, format: 'currency', bold: true },
              sharePct: { value: 29.5, formula: `=ROUND((B2/${runningBalance})*100,1)`, format: 'percentage' },
            },
          },
          {
            id: 'cat-2',
            cells: {
              category: { value: 'Infrastructure', bold: true },
              totalAmount: { value: 420, formula: `=SUMIF('Expenses Log'!C2:C${lastRow},"Infrastructure",'Expenses Log'!E2:E${lastRow})`, format: 'currency', bold: true },
              sharePct: { value: 19.0, formula: `=ROUND((B3/${runningBalance})*100,1)`, format: 'percentage' },
            },
          },
          {
            id: 'cat-3',
            cells: {
              category: { value: 'Utilities', bold: true },
              totalAmount: { value: 350, formula: `=SUMIF('Expenses Log'!C2:C${lastRow},"Utilities",'Expenses Log'!E2:E${lastRow})`, format: 'currency', bold: true },
              sharePct: { value: 15.9, formula: `=ROUND((B4/${runningBalance})*100,1)`, format: 'percentage' },
            },
          },
          {
            id: 'cat-4',
            cells: {
              category: { value: 'Equipment', bold: true },
              totalAmount: { value: 310, formula: `=SUMIF('Expenses Log'!C2:C${lastRow},"Equipment",'Expenses Log'!E2:E${lastRow})`, format: 'currency', bold: true },
              sharePct: { value: 14.1, formula: `=ROUND((B5/${runningBalance})*100,1)`, format: 'percentage' },
            },
          },
          {
            id: 'cat-5',
            cells: {
              category: { value: 'Software', bold: true },
              totalAmount: { value: 290, formula: `=SUMIF('Expenses Log'!C2:C${lastRow},"Software",'Expenses Log'!E2:E${lastRow})`, format: 'currency', bold: true },
              sharePct: { value: 13.2, formula: `=ROUND((B6/${runningBalance})*100,1)`, format: 'percentage' },
            },
          },
          {
            id: 'cat-6',
            cells: {
              category: { value: 'Operations', bold: true },
              totalAmount: { value: 185, formula: `=SUMIF('Expenses Log'!C2:C${lastRow},"Operations",'Expenses Log'!E2:E${lastRow})`, format: 'currency', bold: true },
              sharePct: { value: 8.4, formula: `=ROUND((B7/${runningBalance})*100,1)`, format: 'percentage' },
            },
          },
        ],
      },
    ],
    charts: [
      {
        id: 'chart-expenses',
        title: 'Expense Breakdown by Item',
        type: requestedChartType || 'bar',
        sheetName: 'Expenses Log',
        labelColumnKey: 'description',
        valueColumnKeys: ['amount'],
      },
    ],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Natural-Language Excel Workbook Editor (Requirement 43)
 * Handles:
 * - "Add a total column"
 * - "Create another sheet" / "Add a summary sheet"
 * - "Add a bar chart" / "Add a pie chart" / "Add a line chart"
 * - "Change the currency to PKR"
 * - "Sort by amount"
 * - "Highlight students below 50%"
 * - "Rename the sheet"
 * - "Add 20 rows" / "Add 5 rows"
 */
export function applyExcelModification(
  existing: ExcelWorkbookData,
  instruction: string
): ExcelWorkbookData {
  const lower = instruction.toLowerCase().trim();

  // 0. Character / Topic switch (e.g. "of Batman", "Batman", "Superman")
  if (/^(of\s+)?batman\b/i.test(lower) && !existing.title.toLowerCase().includes('batman')) {
    return generateExcelWorkbook('Batman', instruction, true, 'bar');
  }
  if (/^(of\s+)?superman\b/i.test(lower) && !existing.title.toLowerCase().includes('superman')) {
    return generateExcelWorkbook('Superman', instruction, true, 'bar');
  }

  let updatedSheets = existing.sheets.map((s) => ({
    ...s,
    columns: [...s.columns],
    rows: s.rows.map((r) => ({ ...r, cells: { ...r.cells } })),
  }));
  let updatedCharts = [...existing.charts];
  let updatedCurrency = existing.currencySymbol;
  let updatedSubtitle = existing.subtitle;

  // 1. Currency change (e.g. "Change the currency to PKR")
  if (/\bcurrency\b/i.test(lower) || /\b(pkr|eur|gbp|inr|usd|rupees)\b/i.test(lower)) {
    updatedCurrency = detectCurrencyFromPrompt(instruction);
    updatedSubtitle = `Updated Currency (${updatedCurrency.trim()}) • ${updatedSheets.length} Sheets`;
  }

  // 2. Add a chart (e.g. "Add a bar chart", "Add a pie chart", "Add a line chart")
  if (/\b(add|create|show)\s+(a\s+)?(bar|line|pie|column)?\s*chart\b/i.test(lower)) {
    let type: 'bar' | 'line' | 'pie' | 'column' = 'bar';
    if (/\bpie\b/i.test(lower)) type = 'pie';
    else if (/\bline\b/i.test(lower)) type = 'line';
    else if (/\bcolumn\b/i.test(lower)) type = 'column';

    const primarySheet = updatedSheets[0];
    const labelCol = primarySheet.columns[0]?.key || 'name';
    const numCols = primarySheet.columns.filter(
      (c) => c.format === 'number' || c.format === 'currency' || c.format === 'percentage'
    );
    const valCol = numCols[numCols.length - 1]?.key || primarySheet.columns[1]?.key || 'value';

    updatedCharts = [
      {
        id: `chart-${Date.now()}`,
        title: `${existing.title} — ${type.toUpperCase()} Chart`,
        type,
        sheetName: primarySheet.name,
        labelColumnKey: labelCol,
        valueColumnKeys: [valCol],
      },
    ];
  }

  // 3. Sort by amount / total / score / adherents / weight
  if (/\bsort\s+by\b/i.test(lower)) {
    const primarySheet = updatedSheets[0];
    const dataRows = primarySheet.rows.filter((r) => !r.isSummaryRow);
    const summaryRows = primarySheet.rows.filter((r) => r.isSummaryRow);

    const cleanSortTarget = lower.replace(/^(please\s+|can\s+you\s+)?sort\s+by\s+/i, '').trim();
    const sortWords = cleanSortTarget.split(/\s+/).filter((w) => !/^(the|a|an|by|in|order)\b/i.test(w));

    const numCol =
      primarySheet.columns.find((c) => {
        const h = c.header.toLowerCase();
        const k = c.key.toLowerCase();
        return sortWords.some((w) => h.includes(w) || k.includes(w));
      }) ||
      primarySheet.columns.find((c) => lower.includes(c.header.toLowerCase()) || lower.includes(c.key.toLowerCase())) ||
      primarySheet.columns.find((c) => c.format === 'currency' || c.format === 'number');

    if (numCol) {
      dataRows.sort((a, b) => {
        const va = Number(a.cells[numCol.key]?.value) || 0;
        const vb = Number(b.cells[numCol.key]?.value) || 0;
        return /\b(asc|lowest|smallest)\b/i.test(lower) ? va - vb : vb - va;
      });
      primarySheet.rows = [...dataRows, ...summaryRows];
      updatedSubtitle = `Sorted by ${numCol.header} • ${dataRows.length} Rows • Formulas Active`;
    }
  }

  // 4. Highlight values (e.g. "Highlight Failing Marks (< 50)", "Highlight Top Achievers", "Highlight Low Stock", "Highlight Checkup Due")
  if (/\bhighlight\b/i.test(lower)) {
    const primarySheet = updatedSheets[0];
    const isCheckupDue = /\b(checkup|due|grooming)\b/i.test(lower);
    const isFailing = /\b(fail|failing|<|below|under)\b/i.test(lower) && !/\btop\b/i.test(lower);
    const isTopAchiever = /\b(top|achiever|high|>=|>|above|over)\b/i.test(lower) && !/\bfail\b/i.test(lower);
    const numMatch = lower.match(/(\d+)/);
    const threshold = numMatch ? Number(numMatch[1]) : isFailing ? 50 : isTopAchiever ? 90 : 10;

    primarySheet.rows = primarySheet.rows.map((row) => {
      if (row.isSummaryRow) return row;
      const newCells = { ...row.cells };

      for (const col of primarySheet.columns) {
        if (isCheckupDue) {
          const textVal = String(newCells[col.key]?.value || '');
          if (/due/i.test(textVal)) {
            newCells[col.key] = { ...newCells[col.key], highlight: 'amber' };
          }
        } else if (col.format === 'percentage' || col.format === 'number' || col.format === 'currency') {
          const val = Number(newCells[col.key]?.value);
          if (!isNaN(val)) {
            if (isFailing && val < threshold) {
              newCells[col.key] = { ...newCells[col.key], highlight: 'rose' };
            } else if (isTopAchiever && val >= threshold) {
              newCells[col.key] = { ...newCells[col.key], highlight: 'emerald' };
            }
          }
        }
      }
      return { ...row, cells: newCells };
    });
  }

  // 5. Add a Total / Total Marks column (Calculates real SUM of subject/numeric columns)
  const isTotalColRequest =
    /\b(add\s+a?\s*(total(\s+marks?)?|sum)\s*column|calculate\s*total)\b/i.test(lower);
  if (isTotalColRequest) {
    const primarySheet = updatedSheets[0];
    const existingTotalIdx = primarySheet.columns.findIndex((c) => /\btotal\b/i.test(c.header));
    const numericCols = primarySheet.columns.filter(
      (c) =>
        (c.format === 'number' || c.format === 'currency') &&
        !/\btotal\b/i.test(c.header) &&
        !/\b(id|roll|#|index|no)\b/i.test(c.key) &&
        !/\b(id|roll|#|index|no)\b/i.test(c.header)
    );

    const isAcademic = /\b(marks|student|grade|exam|school|class)\b/i.test(
      `${existing.title} ${primarySheet.columns.map((c) => c.header).join(' ')}`
    );
    const headerTitle = isAcademic ? 'Total Marks' : 'Total';
    const colKey =
      existingTotalIdx >= 0
        ? primarySheet.columns[existingTotalIdx].key
        : `col_total_${Date.now().toString(36).slice(-4)}`;

    if (existingTotalIdx < 0) {
      primarySheet.columns.push({
        key: colKey,
        header: headerTitle,
        width: 16,
        align: 'right',
        format: numericCols[0]?.format === 'currency' ? 'currency' : 'number',
      });
    }

    const firstNumIdx = primarySheet.columns.findIndex((c) => c.key === numericCols[0]?.key);
    const lastNumIdx = primarySheet.columns.findIndex(
      (c) => c.key === numericCols[numericCols.length - 1]?.key
    );
    const startLetter = String.fromCharCode(65 + Math.max(0, firstNumIdx >= 0 ? firstNumIdx : 1));
    const endLetter = String.fromCharCode(65 + Math.max(0, lastNumIdx >= 0 ? lastNumIdx : 4));

    primarySheet.rows = primarySheet.rows.map((row, idx) => {
      const sumVal = numericCols.reduce(
        (acc, c) => acc + (Number(row.cells[c.key]?.value) || 0),
        0
      );
      return {
        ...row,
        cells: {
          ...row.cells,
          [colKey]: {
            value: sumVal,
            formula: `=SUM(${startLetter}${idx + 2}:${endLetter}${idx + 2})`,
            format: numericCols[0]?.format === 'currency' ? 'currency' : 'number',
            bold: true,
          },
        },
      };
    });
  } else if (/\badd\s+a\s+([\w\s]+)\s+column\b/i.test(lower)) {
    const colMatch = instruction.match(/add\s+a\s+([\w\s]+?)\s+column/i);
    const colTitle = colMatch?.[1]?.trim() || 'Projected +10%';
    const colKey = `col_${Date.now().toString(36).slice(-4)}`;
    const primarySheet = updatedSheets[0];
    const refNumCol =
      primarySheet.columns.find((c) => c.format === 'currency' || c.format === 'number') ||
      primarySheet.columns[primarySheet.columns.length - 1];

    primarySheet.columns.push({
      key: colKey,
      header: colTitle.charAt(0).toUpperCase() + colTitle.slice(1),
      width: 16,
      align: 'right',
      format: refNumCol?.format === 'currency' ? 'currency' : 'number',
    });

    primarySheet.rows = primarySheet.rows.map((row, idx) => {
      const baseVal = Number(row.cells[refNumCol.key]?.value) || 0;
      const computed = +(baseVal * 1.1).toFixed(2);
      return {
        ...row,
        cells: {
          ...row.cells,
          [colKey]: {
            value: computed,
            formula: `=ROUND(${String.fromCharCode(65 + primarySheet.columns.indexOf(refNumCol))}${idx + 2}*1.1, 2)`,
            format: refNumCol?.format === 'currency' ? 'currency' : 'number',
            bold: Boolean(row.isSummaryRow),
          },
        },
      };
    });
  }

  // 6. Calculate Percentage / Add Percentage column
  if (/\b(percentage|average|calc(ulate)?\s+percentage)\b/i.test(lower)) {
    const primarySheet = updatedSheets[0];
    const existingPctIdx = primarySheet.columns.findIndex((c) => /\b(percent|%)\b/i.test(c.header));
    const colKey =
      existingPctIdx >= 0
        ? primarySheet.columns[existingPctIdx].key
        : `col_pct_${Date.now().toString(36).slice(-4)}`;

    if (existingPctIdx < 0) {
      primarySheet.columns.push({
        key: colKey,
        header: 'Percentage (%)',
        width: 16,
        align: 'right',
        format: 'percentage',
      });
    }

    const numericCols = primarySheet.columns.filter(
      (c) => c.format === 'number' && !/\b(total|percent|grade|id|roll)\b/i.test(c.header)
    );

    primarySheet.rows = primarySheet.rows.map((row, idx) => {
      const sum = numericCols.reduce((acc, c) => acc + (Number(row.cells[c.key]?.value) || 0), 0);
      const avg = numericCols.length > 0 ? +(sum / numericCols.length).toFixed(1) : 0;
      return {
        ...row,
        cells: {
          ...row.cells,
          [colKey]: {
            value: avg,
            formula: `=AVERAGE(B${idx + 2}:${String.fromCharCode(65 + numericCols.length)}${idx + 2})`,
            format: 'percentage',
            bold: true,
          },
        },
      };
    });
  }

  // 7. Add Grade column (A, B, C, D, F)
  if (/\b(grade|add\s+grade)\b/i.test(lower)) {
    const primarySheet = updatedSheets[0];
    const existingGradeIdx = primarySheet.columns.findIndex((c) => /\bgrade\b/i.test(c.header));
    const colKey =
      existingGradeIdx >= 0
        ? primarySheet.columns[existingGradeIdx].key
        : `col_grade_${Date.now().toString(36).slice(-4)}`;

    if (existingGradeIdx < 0) {
      primarySheet.columns.push({
        key: colKey,
        header: 'Grade',
        width: 12,
        align: 'center',
        format: 'text',
      });
    }

    const numCols = primarySheet.columns.filter(
      (c) => c.format === 'number' && !/\b(id|roll)\b/i.test(c.header)
    );

    primarySheet.rows = primarySheet.rows.map((row, idx) => {
      const sum = numCols.reduce((acc, c) => acc + (Number(row.cells[c.key]?.value) || 0), 0);
      const avg = numCols.length > 0 ? sum / numCols.length : 75;
      const letter =
        avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
      return {
        ...row,
        cells: {
          ...row.cells,
          [colKey]: {
            value: letter,
            formula: `=IF(Percentage>=80,"A",IF(Percentage>=60,"B","C"))`,
            format: 'text',
            bold: true,
          },
        },
      };
    });
  }

  // 8. Add rows / Add more students / Add records / Add more pets / Add more religions / Add more characters
  const addRowsMatch = lower.match(/add\s+(\d+)\s*(more\s+)?(characters?|heroes?|villains?|students?|rows?|records?|items?|entries|pets?|cats?|religions?|world\s+religions?|faiths?|traditions?|transactions?)?/i);
  if (addRowsMatch) {
    const countToAdd = Math.min(50, Math.max(1, parseInt(addRowsMatch[1], 10)));
    const primarySheet = updatedSheets[0];
    const dataRows = primarySheet.rows.filter((r) => !r.isSummaryRow);
    const summaryRows = primarySheet.rows.filter((r) => r.isSummaryRow);

    const isAiSheet = /\b(ai|artificial\s+intelligence|machine\s+learning|deep\s+learning|neural|llm|llms|gpt|claude|gemini|deepseek|llama|mistral|benchmark|parameters|token|tokens)\b/i.test(
      `${existing.title} ${existing.subtitle || ''} ${existing.topic || ''} ${primarySheet.columns.map((c) => c.header).join(' ')}`
    );
    const isHeroSheet = /\b(superman|batman|superhero|superheroes|gotham|krypton|character)\b/i.test(
      `${existing.title} ${primarySheet.columns.map((c) => c.header).join(' ')}`
    );
    const isPetSheet = /\b(cat|cats|pet|pets|kitten|dog|animal|breed)\b/i.test(
      `${existing.title} ${primarySheet.columns.map((c) => c.header).join(' ')}`
    );
    const isReligionSheet = /\b(religion|religions|faith|theology|belief|beliefs|islam|christianity|hinduism|buddhism|judaism|sikhism|adherent)\b/i.test(
      `${existing.title} ${primarySheet.columns.map((c) => c.header).join(' ')}`
    );
    const isGamesSheet = /\b(game|games|gaming|videogame|videogames)\b/i.test(
      `${existing.title} ${primarySheet.columns.map((c) => c.header).join(' ')}`
    );
    const isMarksheet =
      !isAiSheet &&
      !isHeroSheet &&
      !isPetSheet &&
      !isReligionSheet &&
      !isGamesSheet &&
      /\b(student|pupil|roll\s*no|marksheet|report\s*card)\b/i.test(
        `${existing.title} ${primarySheet.columns.map((c) => c.header).join(' ')}`
      );

    const extraAiModels = [
      { model: 'Claude 3.5 Sonnet', lab: 'Anthropic', modality: 'Multimodal (Vision/Code)', mmlu: 88.7, contextK: 200, paramsB: 175, status: 'Top Coding SOTA' },
      { model: 'Gemini 1.5 Pro', lab: 'Google DeepMind', modality: 'Multimodal (Audio/Video/Code)', mmlu: 85.9, contextK: 2000, paramsB: 1500, status: 'Frontier Long-Context' },
      { model: 'Llama 3.1 405B', lab: 'Meta AI', modality: 'Text / Code', mmlu: 88.6, contextK: 128, paramsB: 405, status: 'Open Weights Frontier' },
      { model: 'DeepSeek-V2.5', lab: 'DeepSeek', modality: 'Text / Code Reasoning', mmlu: 80.6, contextK: 128, paramsB: 236, status: 'MoE Efficiency King' },
      { model: 'Mistral Large 2', lab: 'Mistral AI', modality: 'Multilingual / Code', mmlu: 84.0, contextK: 128, paramsB: 123, status: 'Frontier European SOTA' },
      { model: 'Qwen 2.5 72B', lab: 'Alibaba Cloud', modality: 'Multilingual / Math', mmlu: 86.1, contextK: 128, paramsB: 72, status: 'Open Weights Math Leader' },
      { model: 'GPT-4o mini', lab: 'OpenAI', modality: 'Multimodal (Vision/Text)', mmlu: 82.0, contextK: 128, paramsB: 8, status: 'High-Speed Frontier' },
    ];

    const extraHeroes = [
      { name: 'Wonder Woman (Diana Prince)', role: 'Demigod Hero', power: 98, year: 1941, origin: 'Themyscira', status: 'Active' },
      { name: 'The Flash (Barry Allen)', role: 'Speedster Hero', power: 96, year: 1956, origin: 'Central City', status: 'Active' },
      { name: 'Aquaman (Arthur Curry)', role: 'King of Atlantis', power: 92, year: 1941, origin: 'Atlantis', status: 'Active' },
      { name: 'Cyborg (Victor Stone)', role: 'Cybernetic Hero', power: 91, year: 1980, origin: 'Detroit', status: 'Active' },
      { name: 'Green Lantern (Hal Jordan)', role: 'Cosmic Protector', power: 95, year: 1959, origin: 'Coast City', status: 'Active' },
      { name: 'Martian Manhunter (J\'onn J\'onzz)', role: 'Alien Hero', power: 97, year: 1955, origin: 'Mars', status: 'Active' },
      { name: 'Hawkgirl (Kendra Saunders)', role: 'Winged Warrior', power: 88, year: 1940, origin: 'Thanagar', status: 'Active' },
    ];

    const extraGames = [
      { title: 'Super Mario Bros.', genre: 'Platformer', studio: 'Nintendo R&D4', year: 1985, salesM: 58, metacritic: 94, status: 'Historic Classic' },
      { title: 'Pokemon Red / Blue', genre: 'Monster RPG', studio: 'Game Freak / Nintendo', year: 1996, salesM: 47, metacritic: 89, status: 'Franchise Pioneer' },
      { title: 'The Elder Scrolls V: Skyrim', genre: 'Open World RPG', studio: 'Bethesda Game Studios', year: 2011, salesM: 60, metacritic: 94, status: 'Legendary Classic' },
      { title: 'Cyberpunk 2077', genre: 'Sci-Fi Action RPG', studio: 'CD Projekt Red', year: 2020, salesM: 25, metacritic: 86, status: 'Modern Success' },
      { title: 'The Legend of Zelda: BotW', genre: 'Action-Adventure', studio: 'Nintendo EPD', year: 2017, salesM: 32, metacritic: 97, status: 'Masterpiece' },
    ];

    const worldReligionsExtra = [
      { name: 'Jainism', adherents: 5, scripture: 'Agamas & Tattvartha Sutra', era: 'c. 6th Century BCE', region: 'South Asia (India)', holySites: 'Palitana & Shikharji', worship: 'Jain Derasar', status: 'Dharmic Tradition' },
      { name: 'Baha’i Faith', adherents: 8, scripture: 'Kitab-i-Aqdas', era: '19th Century CE', region: 'Global & Middle East', holySites: 'Haifa & Acre (Baháʼí Terraces)', worship: 'Lotus Temple', status: 'Global Monotheism' },
      { name: 'Zoroastrianism', adherents: 0.2, scripture: 'Avesta', era: 'c. 1200 BCE', region: 'Iran & South Asia (Parsis)', holySites: 'Yazd Fire Temple, Udvada', worship: 'Agiary (Fire Temple)', status: 'Ancient Monotheism' },
      { name: 'Confucianism', adherents: 6, scripture: 'The Analects (Lunyu)', era: '5th Century BCE', region: 'East Asia (China, Korea)', holySites: 'Temple of Confucius (Qufu)', worship: 'Confucian Temple', status: 'East Asian Tradition' },
      { name: 'Tenrikyo', adherents: 2, scripture: 'Ofudesaki', era: '19th Century CE', region: 'Japan & East Asia', holySites: 'Tenri Jiba (Nara)', worship: 'Tenrikyo Church', status: 'Modern Tradition' },
    ];

    const petNames = [
      'Jasper', 'Smokey', 'Willow', 'Oreo', 'Nala', 'Gizmo', 'Loki', 'Thor',
      'Pepper', 'Socks', 'Barnaby', 'Mochi', 'Archie', 'Ziggy', 'Kiki', 'Mittens'
    ];
    const catBreeds = [
      'Russian Blue', 'Birman', 'Chartreux', 'Burmese', 'Devon Rex',
      'Norwegian Forest', 'Turkish Angora', 'Abyssinian', 'Balinese', 'Tonkinese'
    ];

    const studentNames = [
      'Hamza Tariq',
      'Areeba Noor',
      'Usman Farooq',
      'Fatima Zahra',
      'Bilal Ahmed',
      'Zainab Malik',
      'Daniyal Shah',
      'Maryam Raza',
      'Saad Qureshi',
      'Hira Javed',
      'Ahmed Raza',
      'Mehwish Khan',
      'Mustafa Ali',
      'Ayesha Siddiqa',
      'Farhan Akhtar',
    ];

    // Subject/raw score columns (numeric columns that aren't ID, Total, or Percentage)
    const rawDataCols = primarySheet.columns.filter(
      (c) =>
        c.format === 'number' &&
        !/\b(total|sum|percent|%|grade|id|roll|#|index|no|adherent)\b/i.test(c.header) &&
        !/\b(total|sum|percent|%|grade|id|roll|#|index|no|adherent)\b/i.test(c.key)
    );

    const firstSubjectColIdx = primarySheet.columns.findIndex((c) => c.key === rawDataCols[0]?.key);
    const lastSubjectColIdx = primarySheet.columns.findIndex(
      (c) => c.key === rawDataCols[rawDataCols.length - 1]?.key
    );
    const subStartLetter = String.fromCharCode(65 + Math.max(0, firstSubjectColIdx >= 0 ? firstSubjectColIdx : 1));
    const subEndLetter = String.fromCharCode(
      65 + Math.max(0, lastSubjectColIdx >= 0 ? lastSubjectColIdx : rawDataCols.length)
    );

    for (let i = 0; i < countToAdd; i++) {
      const rowNum = dataRows.length + 2;
      const newCells: Record<string, any> = {};

      if (isReligionSheet) {
        const extra = worldReligionsExtra[i % worldReligionsExtra.length];
        primarySheet.columns.forEach((col) => {
          if (col.key === 'religion' || col.header.toLowerCase().includes('religion')) {
            newCells[col.key] = { value: extra.name, format: 'text', bold: true };
          } else if (col.key === 'adherents' || col.header.toLowerCase().includes('adherent')) {
            newCells[col.key] = { value: extra.adherents, format: 'number', bold: true };
          } else if (col.key === 'sharePct' || col.header.toLowerCase().includes('share')) {
            newCells[col.key] = {
              value: +(extra.adherents / 78).toFixed(1),
              formula: `=ROUND((B${rowNum}/7800)*100,1)`,
              format: 'percentage',
              bold: true,
            };
          } else if (col.key === 'sacredText' || col.header.toLowerCase().includes('scripture')) {
            newCells[col.key] = { value: extra.scripture, format: 'text' };
          } else if (col.key === 'originEra' || col.header.toLowerCase().includes('origin')) {
            newCells[col.key] = { value: extra.era, format: 'text' };
          } else if (col.key === 'primaryRegion' || col.header.toLowerCase().includes('region')) {
            newCells[col.key] = { value: extra.region, format: 'text' };
          } else if (col.key === 'holySites' || col.header.toLowerCase().includes('site')) {
            newCells[col.key] = { value: extra.holySites, format: 'text' };
          } else if (col.key === 'status') {
            newCells[col.key] = { value: extra.status, format: 'status', bold: true };
          } else {
            newCells[col.key] = { value: '-' };
          }
        });
      } else if (isGamesSheet) {
        const extra = extraGames[i % extraGames.length];
        primarySheet.columns.forEach((col) => {
          if (col.key === 'title' || col.header.toLowerCase().includes('title') || col.header.toLowerCase().includes('game')) {
            newCells[col.key] = { value: extra.title, format: 'text', bold: true };
          } else if (col.key === 'genre' || col.header.toLowerCase().includes('genre')) {
            newCells[col.key] = { value: extra.genre, format: 'text' };
          } else if (col.key === 'studio' || col.header.toLowerCase().includes('studio') || col.header.toLowerCase().includes('publisher')) {
            newCells[col.key] = { value: extra.studio, format: 'text' };
          } else if (col.key === 'year' || col.header.toLowerCase().includes('year')) {
            newCells[col.key] = { value: extra.year, format: 'number' };
          } else if (col.key === 'salesM' || col.header.toLowerCase().includes('sales')) {
            newCells[col.key] = { value: extra.salesM, format: 'number', bold: true };
          } else if (col.key === 'metacritic' || col.header.toLowerCase().includes('metacritic') || col.header.toLowerCase().includes('score')) {
            newCells[col.key] = { value: extra.metacritic, format: 'number', bold: true, highlight: extra.metacritic >= 95 ? 'emerald' : null };
          } else if (col.key === 'status') {
            newCells[col.key] = { value: extra.status, format: 'status', bold: true };
          } else {
            newCells[col.key] = { value: '-' };
          }
        });
      } else if (isHeroSheet) {
        const extra = extraHeroes[i % extraHeroes.length];
        primarySheet.columns.forEach((col) => {
          if (col.key === 'character' || col.header.toLowerCase().includes('character') || col.header.toLowerCase().includes('name')) {
            newCells[col.key] = { value: extra.name, format: 'text', bold: true };
          } else if (col.key === 'role' || col.header.toLowerCase().includes('role')) {
            newCells[col.key] = { value: extra.role, format: 'text' };
          } else if (col.key === 'power' || col.header.toLowerCase().includes('power') || col.header.toLowerCase().includes('score')) {
            newCells[col.key] = { value: extra.power, format: 'number', bold: true, highlight: 'emerald' };
          } else if (col.key === 'year' || col.header.toLowerCase().includes('year')) {
            newCells[col.key] = { value: extra.year, format: 'number' };
          } else if (col.key === 'origin' || col.header.toLowerCase().includes('origin') || col.header.toLowerCase().includes('home')) {
            newCells[col.key] = { value: extra.origin, format: 'text' };
          } else if (col.key === 'status') {
            newCells[col.key] = { value: extra.status, format: 'status', bold: true };
          } else {
            newCells[col.key] = { value: '-' };
          }
        });
      } else if (isAiSheet) {
        const extra = extraAiModels[i % extraAiModels.length];
        primarySheet.columns.forEach((col) => {
          const h = col.header.toLowerCase();
          if (col.key === 'model' || h.includes('model') || h.includes('system') || (h.includes('name') && !h.includes('lab'))) {
            newCells[col.key] = { value: extra.model, format: 'text', bold: true };
          } else if (col.key === 'developer' || h.includes('developer') || h.includes('lab') || h.includes('creator') || h.includes('company')) {
            newCells[col.key] = { value: extra.lab, format: 'text' };
          } else if (col.key === 'modality' || h.includes('modality') || h.includes('type')) {
            newCells[col.key] = { value: extra.modality, format: 'text' };
          } else if (col.key === 'mmlu' || h.includes('mmlu') || h.includes('benchmark') || h.includes('accuracy') || h.includes('score')) {
            newCells[col.key] = { value: extra.mmlu, format: 'percentage', bold: true, highlight: extra.mmlu >= 85 ? 'emerald' : null };
          } else if (col.key === 'context' || h.includes('context') || h.includes('window')) {
            newCells[col.key] = { value: extra.contextK, format: 'number', bold: true };
          } else if (col.key === 'parameters' || h.includes('parameter') || h.includes('size')) {
            newCells[col.key] = { value: extra.paramsB, format: 'number' };
          } else if (col.key === 'status' || h.includes('status')) {
            newCells[col.key] = { value: extra.status, format: 'status', bold: true };
          } else {
            newCells[col.key] = { value: '-' };
          }
        });
      } else {
        // 1. Generate primary scores first
        let computedTotal = 0;
        rawDataCols.forEach((col, scIdx) => {
          const marks = isMarksheet
            ? 52 + ((i * 13 + scIdx * 17 + 7) % 45) // Realistic marks from 52 to 96
            : 100 + ((i * 15 + scIdx * 23) % 90);
          computedTotal += marks;
          newCells[col.key] = {
            value: marks,
            format: 'number',
          };
        });

        const avgPct = rawDataCols.length > 0 ? +(computedTotal / rawDataCols.length).toFixed(1) : 75;
        const letterGrade =
          avgPct >= 90 ? 'A+' : avgPct >= 80 ? 'A' : avgPct >= 70 ? 'B' : avgPct >= 60 ? 'C' : avgPct >= 50 ? 'D' : 'F';
        const isFailing = avgPct < 50;

        // 2. Populate all columns
        primarySheet.columns.forEach((col, cIdx) => {
          if (rawDataCols.some((sc) => sc.key === col.key)) {
            // Already populated with score
            return;
          }

          // Student name or entity label
          if (
            /\b(student|pupil|candidate)\b/i.test(col.header) ||
            (/\bname\b/i.test(col.header) && !/\bbreed\b/i.test(col.header)) ||
            (cIdx === 0 && col.format === 'text')
          ) {
            const name = isPetSheet
              ? petNames[(dataRows.length + i) % petNames.length]
              : isMarksheet
              ? studentNames[(dataRows.length + i) % studentNames.length]
              : `Record #${dataRows.length + 1}`;
            newCells[col.key] = {
              value: name,
              format: 'text',
              bold: true,
            };
          } else if (/\bbreed\b/i.test(col.header)) {
            newCells[col.key] = {
              value: catBreeds[(dataRows.length + i) % catBreeds.length],
              format: 'text',
            };
          } else if (/\b(id|roll)\b/i.test(col.header) || /\b(id|roll)\b/i.test(col.key)) {
            newCells[col.key] = {
              value: 100 + dataRows.length + 1,
              format: 'text',
              bold: true,
            };
          } else if (/\btotal\b/i.test(col.header)) {
            newCells[col.key] = {
              value: computedTotal,
              formula: `=SUM(${subStartLetter}${rowNum}:${subEndLetter}${rowNum})`,
              format: 'number',
              bold: true,
            };
          } else if (/\b(percent|%)\b/i.test(col.header)) {
            newCells[col.key] = {
              value: avgPct,
              formula: `=ROUND((AVERAGE(${subStartLetter}${rowNum}:${subEndLetter}${rowNum})),1)`,
              format: 'percentage',
              bold: true,
              highlight: isFailing ? 'rose' : avgPct >= 90 ? 'emerald' : null,
            };
          } else if (/\bgrade\b/i.test(col.header)) {
            newCells[col.key] = {
              value: letterGrade,
              formula: `=IF(${subEndLetter}${rowNum}>=90,"A+",IF(${subEndLetter}${rowNum}>=80,"A","B"))`,
              format: 'status',
              bold: true,
              highlight: isFailing ? 'rose' : letterGrade.startsWith('A') ? 'emerald' : null,
            };
          } else if (col.format === 'currency') {
            newCells[col.key] = {
              value: 250 + ((i * 45) % 800),
              format: 'currency',
            };
          } else if (col.format === 'number') {
            newCells[col.key] = {
              value: 70 + ((i * 9) % 25),
              format: 'number',
            };
          } else {
            newCells[col.key] = { value: '-' };
          }
        });
      }

      dataRows.push({
        id: `added-row-${Date.now()}-${i}`,
        cells: newCells,
      });
    }

    // 3. Recalculate summary rows (Class Average / Grand Total / Religion Adherents)
    const updatedSummaryRows = summaryRows.map((sRow) => {
      const updatedCells = { ...sRow.cells };
      primarySheet.columns.forEach((col, cIdx) => {
        const colLetter = String.fromCharCode(65 + cIdx);
        if (isReligionSheet && (col.key === 'adherents' || col.header.toLowerCase().includes('adherent'))) {
          const totalAdherents = dataRows.reduce((acc, r) => acc + (Number(r.cells[col.key]?.value) || 0), 0);
          updatedCells[col.key] = {
            value: totalAdherents,
            formula: `=SUM(${colLetter}2:${colLetter}${dataRows.length + 1})`,
            format: 'number',
            bold: true,
          };
        } else if (col.format === 'number') {
          const sum = dataRows.reduce((acc, r) => acc + (Number(r.cells[col.key]?.value) || 0), 0);
          const avg = dataRows.length > 0 ? +(sum / dataRows.length).toFixed(1) : 0;
          updatedCells[col.key] = {
            value: avg,
            formula: `=AVERAGE(${colLetter}2:${colLetter}${dataRows.length + 1})`,
            format: 'number',
            bold: true,
          };
        } else if (col.format === 'percentage') {
          const sum = dataRows.reduce((acc, r) => acc + (Number(r.cells[col.key]?.value) || 0), 0);
          const avg = dataRows.length > 0 ? +(sum / dataRows.length).toFixed(1) : 0;
          updatedCells[col.key] = {
            value: avg,
            format: 'percentage',
            bold: true,
          };
        }
      });
      return { ...sRow, cells: updatedCells };
    });

    primarySheet.rows = [...dataRows, ...updatedSummaryRows];
    updatedSubtitle = `${dataRows.length} Records/Rows • ${primarySheet.columns.length} Columns • Formulas Active`;
  }

  // 9. Class Average / Summary row
  if (/\b(average|summary)\s*row\b/i.test(lower)) {
    const primarySheet = updatedSheets[0];
    const dataRows = primarySheet.rows.filter((r) => !r.isSummaryRow);
    const sumCells: Record<string, any> = {};

    primarySheet.columns.forEach((col, cIdx) => {
      if (cIdx === 0) {
        sumCells[col.key] = { value: 'Class Average', format: 'text', bold: true };
      } else if (col.format === 'number') {
        const sum = dataRows.reduce((acc, r) => acc + (Number(r.cells[col.key]?.value) || 0), 0);
        const avg = dataRows.length > 0 ? +(sum / dataRows.length).toFixed(1) : 0;
        sumCells[col.key] = {
          value: avg,
          formula: `=AVERAGE(${String.fromCharCode(65 + cIdx)}2:${String.fromCharCode(65 + cIdx)}${dataRows.length + 1})`,
          format: 'number',
          bold: true,
        };
      } else if (col.format === 'percentage') {
        const sum = dataRows.reduce((acc, r) => acc + (Number(r.cells[col.key]?.value) || 0), 0);
        const avg = dataRows.length > 0 ? +(sum / dataRows.length).toFixed(1) : 0;
        sumCells[col.key] = { value: avg, format: 'percentage', bold: true };
      } else {
        sumCells[col.key] = { value: '-' };
      }
    });

    primarySheet.rows = [
      ...dataRows,
      {
        id: 'summary-class-avg',
        isSummaryRow: true,
        cells: sumCells,
      },
    ];
  }

  // 7. Create another sheet / Add a new sheet / Add Sacred Traditions / Care Supplies
  if (
    /\b(create\s+another\s+sheet|add\s+(another|a\s+new|a\s+dashboard|a\s+summary|care\s+supplies|sacred\s+traditions|stock\s+summary|category\s+summary|detailed\s+summary)\s+sheet|create\s+(sacred\s+traditions|care\s+supplies|stock\s+summary|category\s+summary|detailed\s+summary)\s+sheet)\b/i.test(
      lower
    )
  ) {
    const isAi = /\b(ai|artificial\s+intelligence|machine\s+learning|deep\s+learning|neural|llm|llms|gpt|claude|gemini|deepseek)\b/i.test(`${existing.title} ${existing.subtitle || ''} ${existing.topic || ''}`);
    const isReligion = /\b(religion|faith|theology|belief)\b/i.test(`${existing.title} ${existing.subtitle}`);
    const isPets = /\b(cat|pet|dog|animal)\b/i.test(`${existing.title} ${existing.subtitle}`);

    if (isAi) {
      if (!updatedSheets.some((s) => s.id === 'sheet-ai-arch')) {
        updatedSheets.push({
          id: 'sheet-ai-arch',
          name: 'AI Architecture & Compute Specs',
          freezeHeader: true,
          columns: [
            { key: 'model', header: 'AI Model / System', width: 22, align: 'left', format: 'text' },
            { key: 'arch', header: 'Architecture Type', width: 24, align: 'left', format: 'text' },
            { key: 'compute', header: 'Training Compute (FLOPs x 10²⁴)', width: 24, align: 'right', format: 'number' },
            { key: 'tokens', header: 'Training Dataset (Trillion Tokens)', width: 24, align: 'right', format: 'number' },
            { key: 'gpus', header: 'GPU Cluster Size (H100 GPUs)', width: 22, align: 'right', format: 'number' },
            { key: 'status', header: 'Frontier Status', width: 20, align: 'center', format: 'status' },
          ],
          rows: [
            {
              id: 'ai-arch-1',
              cells: {
                model: { value: 'GPT-4o', bold: true },
                arch: { value: 'Dense Transformer Multimodal' },
                compute: { value: 38.5, format: 'number', bold: true },
                tokens: { value: 15.0, format: 'number' },
                gpus: { value: 24000, format: 'number' },
                status: { value: 'Global Frontier', format: 'status', bold: true, highlight: 'emerald' },
              },
            },
            {
              id: 'ai-arch-2',
              cells: {
                model: { value: 'Claude 3.5 Sonnet', bold: true },
                arch: { value: 'Hybrid MoE Transformer' },
                compute: { value: 42.0, format: 'number', bold: true },
                tokens: { value: 18.0, format: 'number' },
                gpus: { value: 32000, format: 'number' },
                status: { value: 'SOTA Coding Leader', format: 'status', bold: true, highlight: 'emerald' },
              },
            },
            {
              id: 'ai-arch-3',
              cells: {
                model: { value: 'Llama 3.1 405B', bold: true },
                arch: { value: 'Dense Autoregressive Transformer' },
                compute: { value: 38.0, format: 'number', bold: true },
                tokens: { value: 15.6, format: 'number' },
                gpus: { value: 16384, format: 'number' },
                status: { value: 'Open Weights Flagship', format: 'status', bold: true, highlight: 'emerald' },
              },
            },
            {
              id: 'ai-arch-4',
              cells: {
                model: { value: 'DeepSeek-V2.5', bold: true },
                arch: { value: 'Sparse Multi-Head Latent Attention (MLA)' },
                compute: { value: 12.5, format: 'number', bold: true },
                tokens: { value: 8.5, format: 'number' },
                gpus: { value: 10000, format: 'number' },
                status: { value: 'High Efficiency MoE', format: 'status', bold: true, highlight: 'emerald' },
              },
            },
          ],
        });
      }
    } else if (isReligion) {
      if (!updatedSheets.some((s) => s.id === 'sheet-timeline')) {
        updatedSheets.push({
          id: 'sheet-timeline',
          name: 'Historical Eras & Origins',
          freezeHeader: true,
          columns: [
            { key: 'tradition', header: 'Tradition / Faith', width: 22, align: 'left', format: 'text' },
            { key: 'originEra', header: 'Historical Origin Era', width: 22, align: 'left', format: 'text' },
            { key: 'prophetFounder', header: 'Central Prophet / Founder', width: 26, align: 'left', format: 'text' },
            { key: 'scripture', header: 'Primary Sacred Scripture', width: 26, align: 'left', format: 'text' },
            { key: 'primaryHolySite', header: 'Revered Holy Sanctuary', width: 26, align: 'left', format: 'text' },
          ],
          rows: [
            {
              id: 'tl-1',
              cells: {
                tradition: { value: 'Hinduism', bold: true },
                originEra: { value: 'c. 1500 BCE (Vedic Period)' },
                prophetFounder: { value: 'Ancient Vedic Rishis & Sages' },
                scripture: { value: 'The Vedas & Upanishads' },
                primaryHolySite: { value: 'Varanasi & Haridwar' },
              },
            },
            {
              id: 'tl-2',
              cells: {
                tradition: { value: 'Judaism', bold: true },
                originEra: { value: 'c. 1200 BCE' },
                prophetFounder: { value: 'Prophet Abraham & Prophet Moses' },
                scripture: { value: 'Tanakh (Torah & Talmud)' },
                primaryHolySite: { value: 'Western Wall (Jerusalem)' },
              },
            },
            {
              id: 'tl-3',
              cells: {
                tradition: { value: 'Buddhism', bold: true },
                originEra: { value: 'c. 5th Century BCE' },
                prophetFounder: { value: 'Siddhartha Gautama (The Buddha)' },
                scripture: { value: 'Tripitaka (Pali Canon)' },
                primaryHolySite: { value: 'Mahabodhi Temple (Bodh Gaya)' },
              },
            },
            {
              id: 'tl-4',
              cells: {
                tradition: { value: 'Christianity', bold: true },
                originEra: { value: '1st Century CE' },
                prophetFounder: { value: 'Jesus Christ of Nazareth' },
                scripture: { value: 'The Holy Bible (Gospels)' },
                primaryHolySite: { value: 'Church of the Holy Sepulchre (Jerusalem)' },
              },
            },
            {
              id: 'tl-5',
              cells: {
                tradition: { value: 'Islam', bold: true },
                originEra: { value: '610 CE' },
                prophetFounder: { value: 'Prophet Muhammad (Peace Be Upon Him)' },
                scripture: { value: 'The Holy Quran (Al-Qur’an)' },
                primaryHolySite: { value: 'Masjid al-Haram (Makkah al-Mukarramah)' },
              },
            },
            {
              id: 'tl-6',
              cells: {
                tradition: { value: 'Sikhism', bold: true },
                originEra: { value: '1469 CE' },
                prophetFounder: { value: 'Guru Nanak Dev Ji' },
                scripture: { value: 'Guru Granth Sahib' },
                primaryHolySite: { value: 'Harmandir Sahib (Amritsar)' },
              },
            },
          ],
        });
      }
    } else if (isPets) {
      if (!updatedSheets.some((s) => s.id === 'sheet-nutrition')) {
        updatedSheets.push({
          id: 'sheet-nutrition',
          name: 'Veterinary Diet & Nutrition',
          freezeHeader: true,
          columns: [
            { key: 'breed', header: 'Cat Breed / Profile', width: 22, align: 'left', format: 'text' },
            { key: 'calories', header: 'Daily Calories (kcal)', width: 20, align: 'right', format: 'number' },
            { key: 'protein', header: 'Protein % Target', width: 18, align: 'right', format: 'percentage' },
            { key: 'schedule', header: 'Feeding Schedule', width: 22, align: 'left', format: 'text' },
            { key: 'dietType', header: 'Recommended Diet Formula', width: 26, align: 'left', format: 'text' },
          ],
          rows: [
            {
              id: 'nut-1',
              cells: {
                breed: { value: 'Maine Coon', bold: true },
                calories: { value: 380, format: 'number' },
                protein: { value: 42, format: 'percentage', bold: true },
                schedule: { value: '2 Meals Daily' },
                dietType: { value: 'High Protein + Joint Glucosamine' },
              },
            },
            {
              id: 'nut-2',
              cells: {
                breed: { value: 'British Shorthair', bold: true },
                calories: { value: 240, format: 'number' },
                protein: { value: 38, format: 'percentage', bold: true },
                schedule: { value: '2 Controlled Portions' },
                dietType: { value: 'Lean Weight Management Formula' },
              },
            },
            {
              id: 'nut-3',
              cells: {
                breed: { value: 'Siamese', bold: true },
                calories: { value: 220, format: 'number' },
                protein: { value: 40, format: 'percentage', bold: true },
                schedule: { value: '3 Small Meals Daily' },
                dietType: { value: 'High Metabolism Delicate Formula' },
              },
            },
          ],
        });
      }
    } else {
      const sheetNum = updatedSheets.length + 1;
      const topicName = existing.topic || 'Analysis';
      updatedSheets.push({
        id: `sheet-extra-${Date.now()}`,
        name: `${topicName} Insights ${sheetNum}`,
        freezeHeader: true,
        columns: [
          { key: 'metric', header: `${topicName} Benchmark Indicator`, width: 26, align: 'left', format: 'text' },
          { key: 'benchmark', header: 'Target Benchmark', width: 18, align: 'right', format: 'number' },
          { key: 'score', header: 'Observed Value', width: 18, align: 'right', format: 'number' },
          { key: 'status', header: 'Performance Status', width: 18, align: 'center', format: 'status' },
        ],
        rows: [
          {
            id: 'an-1',
            cells: {
              metric: { value: 'Quality Index', bold: true },
              benchmark: { value: 85, format: 'number' },
              score: { value: 92, format: 'number', highlight: 'emerald' },
              status: { value: 'Exceeds Benchmark', format: 'status', bold: true, highlight: 'emerald' },
            },
          },
          {
            id: 'an-2',
            cells: {
              metric: { value: 'Consistency Rate', bold: true },
              benchmark: { value: 80, format: 'number' },
              score: { value: 88, format: 'number', highlight: 'emerald' },
              status: { value: 'High Alignment', format: 'status', bold: true, highlight: 'emerald' },
            },
          },
        ],
      });
    }
  }

  // 8. Rename the sheet
  const renameMatch = instruction.match(/rename\s+(?:the\s+)?sheet\s+(?:to\s+)?["']?([^"'.!]+)["']?/i);
  if (renameMatch && renameMatch[1]) {
    const newName = renameMatch[1].trim().slice(0, 28);
    if (updatedSheets[0]) {
      updatedSheets[0].name = newName;
    }
  }

  return {
    ...existing,
    id: `xlsx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    currencySymbol: updatedCurrency,
    subtitle: updatedSubtitle,
    sheets: updatedSheets,
    charts: updatedCharts,
    createdAt: new Date().toISOString(),
  };
}

const EXCEL_BLOCK_REGEX = /```(?:sigma-excel|excel-json)\s*([\s\S]*?)```/i;

export function serializeExcelToMessage(
  workbook: ExcelWorkbookData,
  introSummary?: string
): string {
  const summary =
    introSummary ||
    `I have created your **${workbook.title}** Excel workbook (${workbook.sheets.length} ${
      workbook.sheets.length === 1 ? 'worksheet' : 'worksheets'
    }) with real Excel formulas, formatted columns, and interactive preview.`;
  return `${summary}\n\n\`\`\`sigma-excel\n${JSON.stringify(workbook)}\n\`\`\``;
}

export function extractExcelFromMessage(content: string): {
  workbook: ExcelWorkbookData | null;
  cleanText: string;
} {
  if (!content || !content.includes('sigma-excel')) {
    return { workbook: null, cleanText: content };
  }
  const match = content.match(EXCEL_BLOCK_REGEX);
  if (!match) {
    return { workbook: null, cleanText: content };
  }
  try {
    const parsed = JSON.parse(match[1]) as ExcelWorkbookData;
    const cleanText = content.replace(match[0], '').trim();
    return { workbook: parsed, cleanText };
  } catch (e) {
    console.warn('Failed to parse sigma-excel block:', e);
    return { workbook: null, cleanText: content };
  }
}
