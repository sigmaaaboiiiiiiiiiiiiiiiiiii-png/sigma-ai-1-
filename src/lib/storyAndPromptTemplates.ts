/**
 * Story & Image Prompt templates and helpers for Sigma AI (Version 6.0 Protocol)
 */

export const MYSTERIOUS_PURPLE_DOOR_STORY =
`The Mysterious Purple Door

One evening, a boy named Ayaan was walking home when he noticed something strange. Between two old buildings stood a small purple door that he had never seen before.

Curious, Ayaan slowly opened it.

Behind the door was not a room, but a beautiful forest filled with glowing flowers, floating lanterns, and tiny golden birds. In the middle of the forest stood an enormous tree with a message carved into its trunk:

“Only those who are brave enough to explore may discover the truth.”

Ayaan walked deeper into the forest. Suddenly, he heard a tiny voice calling for help. He followed the sound and found a little fox trapped under a fallen branch.

Ayaan pushed the branch aside and freed the fox.

The fox looked at him and said, “You have passed the test.”

Before Ayaan could ask what it meant, the entire forest began to glow. The purple door appeared again.

The fox smiled. “Whenever you feel afraid, remember that courage doesn't mean having no fear. It means moving forward even when you are afraid.”

Ayaan stepped through the door.

When he looked back, the forest had disappeared.

The next morning, the purple door was gone—but Ayaan knew that somewhere, in a magical place beyond ordinary eyes, his adventure was only beginning. ✨

↳ Add a stronger ending twist   ↳ Show feeling more clearly`;

export const PURPLE_DOOR_TWIST_ENDING =
`The Mysterious Purple Door — Twist Ending

As Ayaan stepped back through the door into the familiar alleyway, the warm glow of the lantern flowers faded behind him. He reached into his coat pocket and felt something cold and metallic.

He pulled out a small, intricately carved purple key that hadn't been there before.

Engraved along the edge in tiny luminous letters were the words:
"The next door opens when you are ready."

Suddenly, his reflection in a dark puddle caught his eye. His eyes, normally dark brown, now held a faint, shimmering violet glow. Behind him in the reflection, the tiny fox sat atop the brick wall, watched him intently, and whispered through the wind:

"You didn't leave the forest, Ayaan. The forest chose you to carry it."

↳ Explore what the purple key unlocks   ↳ Tell Ayaan's next adventure`;

export const PURPLE_DOOR_EMOTIONAL_VERSION =
`The Mysterious Purple Door — Emotional Perspective

Ayaan’s heart pounded violently against his ribs as his trembling fingers wrapped around the icy brass handle of the purple door. Part of him wanted to turn and sprint toward the safety of his streetlights, but a burning, electric curiosity pulled him forward.

When the heavy wooden frame creaked open, the knot of fear in his stomach unraveled into breathless awe. Tears of wonder prickled his eyes at the sight of luminous floating lanterns and singing golden birds—a world alive with secrets he had only ever dreamed of.

Hearing the distressed whimper of the trapped fox, the hesitation vanished instantly. A surge of fierce determination gripped him. As he strained against the heavy fallen bough, his muscles burning, he didn't feel small anymore.

When the fox revealed the truth about courage, a deep, profound warmth settled into Ayaan’s chest. For the first time in his life, he realized courage wasn't something heroes were born with—it was a quiet choice you made in the dark.

↳ Add a suspenseful cliffhanger   ↳ Return to the purple door`;

export const MASTER_IMAGE_PROMPT_TEMPLATE =
`If you want a powerful and ideal prompt for an image generator, use this and replace the bracketed parts:

Create an ultra-detailed, cinematic, professional-quality image of [MAIN SUBJECT].

Scene: [DESCRIBE THE LOCATION AND ENVIRONMENT].
Action/Pose: [DESCRIBE WHAT THE SUBJECT IS DOING].
Camera: cinematic composition, dynamic perspective, realistic depth of field, professional photography, carefully framed subject.
Lighting: dramatic cinematic lighting, realistic highlights and shadows, atmospheric lighting that matches the environment.
Details: highly detailed textures, realistic materials, natural reflections, subtle environmental effects, sharp subject details, realistic proportions.

Visual style: premium cinematic realism, photorealistic, high-end commercial photography, realistic color grading, atmospheric depth, polished composition, visually striking but natural.

Quality: extremely detailed, crisp focus, realistic textures, accurate perspective, realistic shadows, global illumination, volumetric lighting, HDR, high dynamic range, professional post-processing.

Composition: strong focal point, balanced composition, foreground and background depth, no unnecessary objects, subject clearly visible.

Avoid: blurry details, distorted anatomy, duplicated objects, extra limbs, warped shapes, bad perspective, excessive noise, low resolution, text, watermark, logo distortion, oversaturated colors, artificial-looking details.`;

/**
 * Builds a tailored master prompt for a specific image subject requested by the user
 */
export function buildTailoredImagePrompt(rawQuery: string): string {
  // Clean subject extraction
  let subject = rawQuery
    .replace(/^\s*(generate|create|draw|make|render|produce|paint)\s+(an?\s+)?(image|picture|photo|wallpaper|drawing|artwork|graphic|portrait|illustration)\s+(of|with|showing|depicting)\s+/i, '')
    .replace(/^\s*(image|picture|photo|drawing|paint)\s+(of|with)\s+/i, '')
    .replace(/^\s*(draw|paint)\s+(a|an)?\s+/i, '')
    .trim();

  if (!subject) subject = 'a breathtaking cinematic concept';

  return `I cannot create an image because of technical limits, but I can give you a massive full prompt that works even better.

You can paste this prompt on Gemini Banana Nano 4.0 because I do not have the power to create images yet, but this feature will be available in my app soon. My owner is working hard to add this feature.

Create an ultra-detailed, cinematic, professional-quality image of ${subject}.

Scene: dramatic environmental setting featuring authentic ambient surroundings, natural depth, and thematic atmosphere tailored to ${subject}.
Action/Pose: dynamic, natural, and compelling focal positioning capturing ${subject} at the peak moment of visual interest.
Camera: cinematic composition, dynamic perspective, realistic depth of field, professional photography, carefully framed subject.
Lighting: dramatic cinematic lighting, realistic highlights and shadows, atmospheric lighting that matches the environment.
Details: highly detailed textures, realistic materials, natural reflections, subtle environmental effects, sharp subject details, realistic proportions.

Visual style: premium cinematic realism, photorealistic, high-end commercial photography, realistic color grading, atmospheric depth, polished composition, visually striking but natural.

Quality: extremely detailed, crisp focus, realistic textures, accurate perspective, realistic shadows, global illumination, volumetric lighting, HDR, high dynamic range, professional post-processing.

Composition: strong focal point, balanced composition, foreground and background depth, no unnecessary objects, subject clearly visible.

Avoid: blurry details, distorted anatomy, duplicated objects, extra limbs, warped shapes, bad perspective, excessive noise, low resolution, text, watermark, logo distortion, oversaturated colors, artificial-looking details.`;
}

/**
 * Checks if the prompt is asking for an image prompt template or prompt engineering
 */
export function isImagePromptRequest(query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    /^(create|give|write|generate|make|show)(\s+me)?\s+(a\s+)?prompt\s+(for\s+)?(an?\s+)?image/i.test(q) ||
    /^(image|picture)\s+prompt(\s+template)?$/i.test(q) ||
    /^prompt\s+for\s+(an?\s+)?(image|picture|photo|generator)/i.test(q) ||
    /^how\s+to\s+prompt\s+(for\s+)?image/i.test(q)
  );
}

/**
 * Checks if the prompt is asking to generate/create an image directly
 */
export function isImageGenerationRequest(query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    /^\s*(generate|create|draw|make|render|produce|paint)\s+(an?\s+)?(image|picture|photo|wallpaper|drawing|artwork|graphic|portrait|illustration)\s+(of|with|showing|depicting)/i.test(q) ||
    /^\s*(generate|create|draw|make|paint)\s+(image|picture|photo|wallpaper|artwork):/i.test(q) ||
    q.startsWith('image of ') ||
    q.startsWith('picture of ') ||
    q.startsWith('draw a ') ||
    q.startsWith('draw picture of ')
  );
}

/**
 * Checks if the prompt is asking for the Mysterious Purple Door story or its interactive branch
 */
export function matchPurpleDoorStory(query: string, previousContext?: string): string | null {
  const clean = query.trim().toLowerCase().replace(/[?.,!]/g, '');

  const hasPurpleDoorQuery =
    clean.includes('purple door') ||
    clean === 'the mysterious purple door' ||
    clean === 'write a story about the mysterious purple door' ||
    clean === 'story about purple door' ||
    clean === 'tell me a story about the mysterious purple door' ||
    clean.includes('mysterious purple door');

  if (hasPurpleDoorQuery) {
    if (clean.includes('twist') || clean.includes('stronger ending')) {
      return PURPLE_DOOR_TWIST_ENDING;
    }
    if (clean.includes('feelings') || clean.includes('feeling') || clean.includes('emotion')) {
      return PURPLE_DOOR_EMOTIONAL_VERSION;
    }
    return MYSTERIOUS_PURPLE_DOOR_STORY;
  }

  // Only match twist/emotion variants if the previous conversation context was specifically the Purple Door story
  const isPreviousPurpleDoor = previousContext && /purple door/i.test(previousContext);
  if (isPreviousPurpleDoor) {
    if (clean === 'add a stronger ending twist' || clean.includes('stronger ending twist')) {
      return PURPLE_DOOR_TWIST_ENDING;
    }

    if (
      clean === 'show i am feeling more clearly' ||
      clean === 'show ayaans feelings more clearly' ||
      clean.includes('feeling more clearly') ||
      clean.includes('feelings more clearly') ||
      clean.includes('ayaan feelings')
    ) {
      return PURPLE_DOOR_EMOTIONAL_VERSION;
    }
  }

  return null;
}
