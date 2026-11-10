import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import {
  PowerPointPresentation,
  SlideData,
  SlideTransitionType,
  SlideAnimationStyle,
} from '../types/presentation';

function cleanHex(color: string, fallback = '0F172A'): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      return hex
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase();
    }
    return hex.slice(0, 6).toUpperCase();
  }
  return fallback;
}

function buildPptxSlides(
  pptx: PptxGenJS,
  presentation: PowerPointPresentation
): void {
  pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pptx.title = presentation.title;
  pptx.subject = presentation.subtitle || presentation.topic;
  pptx.author = 'Sigma AI Presentation Studio';

  const pal = presentation.palette;
  const bgHex = cleanHex(pal.bgPrimary, '0B1120');
  const cardHex = cleanHex(pal.cardBg, '17223B');
  const borderHex = cleanHex(pal.cardBorder, '2A3B63');
  const textPrimaryHex = cleanHex(pal.textPrimary, 'F8FAFC');
  const textSecondaryHex = cleanHex(pal.textSecondary, 'CBD5E1');
  const textMutedHex = cleanHex(pal.textMuted, '94A3B8');
  const accent1Hex = cleanHex(pal.accentPrimary, '8B5CF6');
  const accent2Hex = cleanHex(pal.accentSecondary, '06B6D4');
  const highlightHex = cleanHex(pal.accentHighlight, 'EC4899');

  presentation.slides.forEach((s: SlideData, index: number) => {
    const slide = pptx.addSlide();
    slide.background = { color: bgHex };

    if (s.notes) {
      slide.addNotes(s.notes);
    }

    // Subtle decorative background shapes (circles & top accent bar)
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.08,
      fill: { color: index % 2 === 0 ? accent1Hex : accent2Hex },
      line: { color: index % 2 === 0 ? accent1Hex : accent2Hex, width: 0 },
    });

    slide.addShape(pptx.ShapeType.ellipse, {
      x: 8.4,
      y: -0.6,
      w: 2.2,
      h: 2.2,
      fill: { color: accent1Hex, transparency: 88 },
      line: { color: accent1Hex, transparency: 82, width: 1 },
    });

    slide.addShape(pptx.ShapeType.ellipse, {
      x: -0.7,
      y: 4.3,
      w: 1.8,
      h: 1.8,
      fill: { color: accent2Hex, transparency: 90 },
      line: { color: accent2Hex, transparency: 85, width: 1 },
    });

    // Slide header (except full-screen title slide which has its own hero layout)
    if (s.layout !== 'title') {
      if (s.kicker) {
        slide.addText(s.kicker.toUpperCase(), {
          x: 0.6,
          y: 0.32,
          w: 6.5,
          h: 0.26,
          fontSize: 9,
          bold: true,
          color: accent2Hex,
          charSpacing: 2,
          fontFace: 'Arial',
        });
      }

      slide.addText(s.title, {
        x: 0.6,
        y: 0.58,
        w: 8.8,
        h: 0.52,
        fontSize: 22,
        bold: true,
        color: textPrimaryHex,
        fontFace: 'Arial',
      });

      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 0.6,
          y: 1.08,
          w: 8.8,
          h: 0.34,
          fontSize: 12,
          color: textSecondaryHex,
          fontFace: 'Arial',
        });
      }
    }

    const cards = s.cards || [];

    // Layout-specific rendering
    if (s.layout === 'title') {
      // Hero Title Slide
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 0.55,
        w: 3.4,
        h: 0.34,
        rectRadius: 0.08,
        fill: { color: accent1Hex, transparency: 80 },
        line: { color: accent1Hex, width: 1 },
      });

      slide.addText((s.kicker || 'PRESENTATION').toUpperCase(), {
        x: 0.65,
        y: 0.57,
        w: 3.3,
        h: 0.3,
        fontSize: 9,
        bold: true,
        color: accent2Hex,
        align: 'center',
        fontFace: 'Arial',
      });

      slide.addText(s.title, {
        x: 0.6,
        y: 1.08,
        w: 8.8,
        h: 1.15,
        fontSize: 34,
        bold: true,
        color: textPrimaryHex,
        fontFace: 'Arial',
      });

      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 0.6,
          y: 2.22,
          w: 8.2,
          h: 0.55,
          fontSize: 15,
          color: textSecondaryHex,
          fontFace: 'Arial',
        });
      }

      // 3 Pillar Preview Cards at bottom of title slide
      const heroCards = cards.slice(0, 3);
      heroCards.forEach((c, cIdx) => {
        const cardW = 2.8;
        const gap = 0.2;
        const startX = 0.6 + cIdx * (cardW + gap);
        const cardColors = [accent1Hex, accent2Hex, highlightHex];

        slide.addShape(pptx.ShapeType.roundRect, {
          x: startX,
          y: 3.05,
          w: cardW,
          h: 1.85,
          rectRadius: 0.1,
          fill: { color: cardHex },
          line: { color: cardColors[cIdx % 3], width: 1.2 },
        });

        slide.addText(c.badge || `0${cIdx + 1}`, {
          x: startX + 0.18,
          y: 3.2,
          w: cardW - 0.36,
          h: 0.25,
          fontSize: 8.5,
          bold: true,
          color: cardColors[cIdx % 3],
          fontFace: 'Arial',
        });

        slide.addText(c.title, {
          x: startX + 0.18,
          y: 3.48,
          w: cardW - 0.36,
          h: 0.38,
          fontSize: 13,
          bold: true,
          color: textPrimaryHex,
          fontFace: 'Arial',
        });

        slide.addText(c.content, {
          x: startX + 0.18,
          y: 3.9,
          w: cardW - 0.36,
          h: 0.85,
          fontSize: 10,
          color: textSecondaryHex,
          valign: 'top',
          fontFace: 'Arial',
        });
      });
    } else if (
      s.layout === 'comparison' ||
      s.layout === 'problem-solution' ||
      (s.layout === 'two-column' && (s.leftColumn || s.rightColumn))
    ) {
      // Two side-by-side comparison / problem-solution columns (ensures 5+ items across both columns)
      const halfIdx = Math.ceil(cards.length / 2);
      const rawLeftItems = s.leftColumn?.items || [];
      const rawRightItems = s.rightColumn?.items || [];
      const hasEnoughItems =
        rawLeftItems.length + rawRightItems.length >= Math.min(5, cards.length);

      const left =
        s.leftColumn && hasEnoughItems
          ? s.leftColumn
          : {
              title: s.leftColumn?.title || cards[0]?.title || 'Key Perspective A',
              subtitle: s.leftColumn?.subtitle || cards[0]?.badge || '',
              items:
                cards.length >= 2
                  ? cards.slice(0, halfIdx).map((c) => `${c.title}: ${c.content}`)
                  : rawLeftItems,
            };
      const right =
        s.rightColumn && hasEnoughItems
          ? s.rightColumn
          : {
              title: s.rightColumn?.title || cards[halfIdx]?.title || 'Key Perspective B',
              subtitle: s.rightColumn?.subtitle || cards[halfIdx]?.badge || '',
              items:
                cards.length >= 2
                  ? cards.slice(halfIdx).map((c) => `${c.title}: ${c.content}`)
                  : rawRightItems,
            };

      const cols = [
        { data: left, x: 0.6, accent: accent2Hex },
        { data: right, x: 5.1, accent: highlightHex },
      ];

      cols.forEach((col) => {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: col.x,
          y: 1.55,
          w: 4.3,
          h: 3.45,
          rectRadius: 0.12,
          fill: { color: cardHex },
          line: { color: col.accent, width: 1.5 },
        });

        slide.addShape(pptx.ShapeType.rect, {
          x: col.x,
          y: 1.55,
          w: 4.3,
          h: 0.08,
          fill: { color: col.accent },
          line: { color: col.accent, width: 0 },
        });

        slide.addText(col.data.title, {
          x: col.x + 0.25,
          y: 1.75,
          w: 3.8,
          h: 0.42,
          fontSize: 14,
          bold: true,
          color: textPrimaryHex,
          fontFace: 'Arial',
        });

        const bulletText = (col.data.items || [])
          .filter(Boolean)
          .map((item) => `•  ${item}`)
          .join('\n\n');

        slide.addText(bulletText, {
          x: col.x + 0.25,
          y: 2.25,
          w: 3.8,
          h: 2.55,
          fontSize: 10.5,
          color: textSecondaryHex,
          valign: 'top',
          fontFace: 'Arial',
        });
      });
    } else if (s.layout === 'statistics' && s.stats && s.stats.length > 0 && cards.length <= 3) {
      s.stats.slice(0, 3).forEach((st, idx) => {
        const cardW = 2.8;
        const startX = 0.6 + idx * 3.0;
        const accents = [accent1Hex, accent2Hex, highlightHex];

        slide.addShape(pptx.ShapeType.roundRect, {
          x: startX,
          y: 1.6,
          w: cardW,
          h: 3.3,
          rectRadius: 0.12,
          fill: { color: cardHex },
          line: { color: accents[idx % 3], width: 1.4 },
        });

        slide.addText(st.value, {
          x: startX + 0.2,
          y: 1.85,
          w: cardW - 0.4,
          h: 0.75,
          fontSize: 30,
          bold: true,
          color: accents[idx % 3],
          fontFace: 'Arial',
        });

        slide.addText(st.label, {
          x: startX + 0.2,
          y: 2.65,
          w: cardW - 0.4,
          h: 0.4,
          fontSize: 12.5,
          bold: true,
          color: textPrimaryHex,
          fontFace: 'Arial',
        });

        if (st.description) {
          slide.addText(st.description, {
            x: startX + 0.2,
            y: 3.1,
            w: cardW - 0.4,
            h: 1.4,
            fontSize: 10,
            color: textSecondaryHex,
            valign: 'top',
            fontFace: 'Arial',
          });
        }
      });
    } else if (cards.length >= 4) {
      // Multi-Point Grid (renders 4, 5, or 6 explained points in a clean 3x2 or 2x2 grid)
      const displayCards = cards.slice(0, 6);
      const colsCount = displayCards.length >= 5 ? 3 : 2;
      const cardW = colsCount === 3 ? 2.8 : 4.3;
      const colStep = colsCount === 3 ? 3.0 : 4.5;
      const accents = [accent1Hex, accent2Hex, highlightHex];

      displayCards.forEach((c, idx) => {
        const col = idx % colsCount;
        const row = Math.floor(idx / colsCount);
        const cardX = 0.6 + col * colStep;
        const cardY = 1.55 + row * 1.75;
        const accent = accents[idx % 3];

        slide.addShape(pptx.ShapeType.roundRect, {
          x: cardX,
          y: cardY,
          w: cardW,
          h: 1.6,
          rectRadius: 0.1,
          fill: { color: cardHex },
          line: { color: accent, width: 1.2 },
        });

        slide.addText(c.badge || `0${idx + 1}`, {
          x: cardX + 0.16,
          y: cardY + 0.12,
          w: cardW - 0.32,
          h: 0.2,
          fontSize: 8,
          bold: true,
          color: accent,
          fontFace: 'Arial',
        });

        slide.addText(c.title, {
          x: cardX + 0.16,
          y: cardY + 0.34,
          w: cardW - 0.32,
          h: 0.34,
          fontSize: 11.5,
          bold: true,
          color: textPrimaryHex,
          fontFace: 'Arial',
        });

        slide.addText(c.content, {
          x: cardX + 0.16,
          y: cardY + 0.72,
          w: cardW - 0.32,
          h: 0.8,
          fontSize: 9.5,
          color: textSecondaryHex,
          valign: 'top',
          fontFace: 'Arial',
        });
      });
    } else {
      // 3-Column Visual Cards
      const threeCards = cards.slice(0, 3);
      threeCards.forEach((c, idx) => {
        const cardW = 2.8;
        const startX = 0.6 + idx * 3.0;
        const accents = [accent1Hex, accent2Hex, highlightHex];

        slide.addShape(pptx.ShapeType.roundRect, {
          x: startX,
          y: 1.6,
          w: cardW,
          h: 3.35,
          rectRadius: 0.12,
          fill: { color: cardHex },
          line: { color: accents[idx % 3], width: 1.3 },
        });

        slide.addText(c.badge || `0${idx + 1}`, {
          x: startX + 0.2,
          y: 1.8,
          w: cardW - 0.4,
          h: 0.26,
          fontSize: 9,
          bold: true,
          color: accents[idx % 3],
          fontFace: 'Arial',
        });

        slide.addText(c.title, {
          x: startX + 0.2,
          y: 2.12,
          w: cardW - 0.4,
          h: 0.45,
          fontSize: 14,
          bold: true,
          color: textPrimaryHex,
          fontFace: 'Arial',
        });

        if (c.statValue) {
          slide.addText(`${c.statValue}  ${c.statLabel || ''}`, {
            x: startX + 0.2,
            y: 2.6,
            w: cardW - 0.4,
            h: 0.35,
            fontSize: 12,
            bold: true,
            color: accents[idx % 3],
            fontFace: 'Arial',
          });
        }

        slide.addText(c.content, {
          x: startX + 0.2,
          y: c.statValue ? 3.0 : 2.65,
          w: cardW - 0.4,
          h: c.statValue ? 1.75 : 2.1,
          fontSize: 10.5,
          color: textSecondaryHex,
          valign: 'top',
          fontFace: 'Arial',
        });
      });
    }

    // Footer takeaway & Slide Number
    if (s.takeaway) {
      slide.addText(s.takeaway, {
        x: 0.6,
        y: 5.18,
        w: 7.8,
        h: 0.3,
        fontSize: 9.5,
        italic: true,
        color: textMutedHex,
        fontFace: 'Arial',
      });
    }

    slide.addText(`${index + 1} / ${presentation.slides.length}`, {
      x: 8.5,
      y: 5.18,
      w: 0.9,
      h: 0.3,
      fontSize: 9.5,
      bold: true,
      align: 'right',
      color: textMutedHex,
      fontFace: 'Arial',
    });
  });
}

/**
 * Builds OpenXML transition tag (<p:transition>) for the selected PowerPoint transition type.
 */
function buildSlideTransitionXml(
  transition: SlideTransitionType | undefined
): string {
  switch (transition as string) {
    case 'push':
      return '<p:transition spd="med"><p:push dir="l"/></p:transition>';
    case 'fade':
      return '<p:transition spd="med"><p:fade/></p:transition>';
    case 'wipe':
      return '<p:transition spd="med"><p:wipe dir="r"/></p:transition>';
    case 'split':
      return '<p:transition spd="med"><p:split orient="horz"/></p:transition>';
    case 'zoom':
      return '<p:transition spd="med"><p:zoom/></p:transition>';
    case 'morph':
      return '<p:transition spd="med"><p16:morph xmlns:p16="http://schemas.microsoft.com/office/powerpoint/2015/main"/></p:transition>';
    case 'curtains':
      return '<p:transition spd="slow"><p:curtain dir="horz"/></p:transition>';
    case 'drape':
      return '<p:transition spd="med"><p:drape dir="l"/></p:transition>';
    case 'flash':
      return '<p:transition spd="fast"><p:flash/></p:transition>';
    case 'dissolve':
      return '<p:transition spd="med"><p:dissolve/></p:transition>';
    case 'wheel':
      return '<p:transition spd="med"><p:wheel spokes="4"/></p:transition>';
    case 'random-bars':
      return '<p:transition spd="med"><p:randomBar orient="horz"/></p:transition>';
    case 'shape':
      return '<p:transition spd="med"><p:circle/></p:transition>';
    case 'cover':
      return '<p:transition spd="med"><p:cover dir="l"/></p:transition>';
    case 'uncover':
    case 'reveal':
      return '<p:transition spd="med"><p:pull dir="l"/></p:transition>';
    case 'gallery':
    case 'slide':
      return '<p:transition spd="med"><p:push dir="l"/></p:transition>';
    case 'cut':
      return '<p:transition spd="fast"><p:cut/></p:transition>';
    case 'random':
      return '<p:transition spd="med"><p:random/></p:transition>';
    case 'none':
    default:
      return '<p:transition spd="fast"><p:cut/></p:transition>';
  }
}

/**
 * Builds OpenXML timing tag (<p:timing>) for element build animations.
 */
function buildSlideTimingXml(
  shapeIds: string[],
  animStyle: SlideAnimationStyle | undefined
): string {
  if (!animStyle || animStyle === 'appear' || shapeIds.length <= 1) return '';

  const targetIds = shapeIds.slice(1); // skip background shape
  if (targetIds.length === 0) return '';

  let childNodes = '';
  let idCounter = 100;

  let filterType = 'dissolve';
  let presetSubtype = '0';
  let dur = '500';

  if (
    animStyle === 'fly-in' ||
    animStyle === 'slide-in' ||
    animStyle === 'rise-up' ||
    animStyle === 'slide-stagger'
  ) {
    filterType = 'fly';
    presetSubtype = '4'; // from bottom
    dur = '600';
  } else if (
    animStyle === 'zoom' ||
    animStyle === 'scale-pop' ||
    animStyle === 'scale-focus'
  ) {
    filterType = 'zoom';
    presetSubtype = '0'; // in
    dur = '500';
  } else if (animStyle === 'wipe') {
    filterType = 'wipe';
    presetSubtype = '2'; // left to right
    dur = '600';
  } else if (animStyle === 'split') {
    filterType = 'split';
    presetSubtype = '1';
    dur = '500';
  } else if (
    animStyle === 'grow-turn' ||
    animStyle === 'swivel' ||
    animStyle === 'vibe' ||
    animStyle === 'bounce'
  ) {
    filterType = 'spinner';
    presetSubtype = '0';
    dur = '700';
  } else if (animStyle === 'wheel') {
    filterType = 'wheel';
    presetSubtype = '4';
    dur = '600';
  }

  targetIds.forEach((spId, idx) => {
    const pId = idCounter++;
    const bId = idCounter++;
    const animId = idCounter++;
    const delay = idx * 180;

    childNodes += `<p:par><p:cTn id="${pId}" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst><p:set><p:cBhvr><p:cTn id="${bId}" dur="1" fill="hold"/><p:tgtEl><p:spTgt spid="${spId}"/></p:tgtEl></p:cBhvr><p:to><p:visibility val="visible"/></p:to></p:set><p:animEffect transition="in" filter="${filterType}(${presetSubtype})"><p:cBhvr><p:cTn id="${animId}" dur="${dur}" fill="hold"/><p:tgtEl><p:spTgt spid="${spId}"/></p:tgtEl></p:cBhvr></p:animEffect></p:childTnLst></p:cTn></p:par>`;
  });

  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="always" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${childNodes}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
}

export async function downloadPresentationAsPptx(
  presentation: PowerPointPresentation
): Promise<void> {
  const pptx = new PptxGenJS();
  buildPptxSlides(pptx, presentation);

  const safeFileName =
    presentation.title
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'Sigma_AI_Presentation';

  // Export base presentation ArrayBuffer and inject native OpenXML transitions & animations
  const rawArrayBuffer = (await pptx.write({
    outputType: 'arraybuffer',
  })) as ArrayBuffer;

  const zip = await JSZip.loadAsync(rawArrayBuffer);

  for (let i = 0; i < presentation.slides.length; i++) {
    const s = presentation.slides[i];
    const slidePath = `ppt/slides/slide${i + 1}.xml`;
    const slideFile = zip.file(slidePath);
    if (!slideFile) continue;

    let slideXml = await slideFile.async('text');
    const effectiveTrans: SlideTransitionType =
      s.transition || presentation.transitionId || 'fade';
    const effectiveAnim: SlideAnimationStyle =
      s.animationStyle || presentation.animationId || 'fade';

    const transXml = buildSlideTransitionXml(effectiveTrans);

    const shapeIds: string[] = [];
    const shapeRegex = /<p:cNvPr[^>]*\bid="(\d+)"/g;
    let match: RegExpExecArray | null;
    while ((match = shapeRegex.exec(slideXml)) !== null) {
      shapeIds.push(match[1]);
    }

    const timingXml = buildSlideTimingXml(shapeIds, effectiveAnim);
    const injection = `${transXml}${timingXml}`;

    if (injection) {
      slideXml = slideXml.replace('</p:sld>', `${injection}</p:sld>`);
      zip.file(slidePath, slideXml);
    }
  }

  const modifiedBlob = await zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });

  const downloadUrl = URL.createObjectURL(modifiedBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${safeFileName}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
}
