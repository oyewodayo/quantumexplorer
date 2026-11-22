import fs from 'node:fs';
import path from 'node:path';
import { ROUTES, SITE_URL, type RouteMeta } from '../src/state/routes.ts';
import { ROADMAP_LESSONS, ROADMAP_QUIZ } from '../src/content/roadmapContent.ts';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const BASE_HTML_PATH = path.join(DIST_DIR, 'index.html');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRouteBody(route: RouteMeta): string {
  const lessons = route.lessonIds
    .map((id) => ROADMAP_LESSONS.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  const quizzes = route.lessonIds
    .map((id) => ROADMAP_QUIZ.find((q) => q.lessonId === id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const heading = route.title.replace(/\s*·\s*Quantum Explorer$/, '');
  const lessonSections = lessons
    .map(
      (l) =>
        `<article><h2>${escapeHtml(l.title)}</h2><p>${escapeHtml(l.body)}</p></article>`
    )
    .join('\n');

  const quizSections = quizzes
    .map(
      (q) =>
        `<section><h3>${escapeHtml(q.q)}</h3><p><strong>Answer:</strong> ${escapeHtml(q.options[q.correct])}. ${escapeHtml(q.explanation)}</p></section>`
    )
    .join('\n');

  const navLinks = ROUTES.map(
    (r) => `<li><a href="/${r.slug}">${escapeHtml(r.title.replace(/\s*·\s*Quantum Explorer$/, ''))}</a></li>`
  ).join('\n');

  return `<main style="max-width:760px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif">
        <p><a href="/">← Quantum Explorer Home</a></p>
        <h1>${escapeHtml(heading)}</h1>
        <p>${escapeHtml(route.description)}</p>
        ${lessonSections}
        ${quizSections}
        <nav aria-label="All Quantum Explorer topics"><h2>Explore more quantum simulations</h2><ul>${navLinks}</ul></nav>
        <noscript>Quantum Explorer needs JavaScript to run its interactive simulations.</noscript>
      </main>`;
}

function buildJsonLd(route: RouteMeta, canonicalUrl: string): string {
  const heading = route.title.replace(/\s*·\s*Quantum Explorer$/, '');
  const quizzes = route.lessonIds
    .map((id) => ROADMAP_QUIZ.find((q) => q.lessonId === id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'LearningResource',
      name: heading,
      url: canonicalUrl,
      description: route.description,
      learningResourceType: 'Interactive simulation',
      educationalLevel: 'Beginner to intermediate',
      inLanguage: ['en', 'fr', 'es'],
      isAccessibleForFree: true,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Quantum Explorer',
        url: `${SITE_URL}/`,
      },
    },
  ];

  if (quizzes.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: quizzes.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${q.options[q.correct]} — ${q.explanation}`,
        },
      })),
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function prerender(): void {
  if (!fs.existsSync(BASE_HTML_PATH)) {
    throw new Error(`Expected built index.html at ${BASE_HTML_PATH}`);
  }
  const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf8');

  for (const route of ROUTES) {
    const canonicalUrl = `${SITE_URL}/${route.slug}`;
    const safeTitle = escapeHtml(route.title);
    const safeDesc = escapeHtml(route.description);
    const jsonLd = buildJsonLd(route, canonicalUrl);
    const bodyHtml = buildRouteBody(route);

    let html = baseHtml;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);
    html = html.replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${safeDesc}" />`
    );
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );
    html = html.replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${canonicalUrl}" />`
    );
    html = html.replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${safeTitle}" />`
    );
    html = html.replace(
      /<meta property="og:description" content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${safeDesc}" />`
    );
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${jsonLd}</script>`
    );
    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>\s*<script/,
      `<div id="root">${bodyHtml}</div>\n    <script`
    );

    const outDir = path.join(DIST_DIR, route.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    ...ROUTES.map((r) => ({ loc: `${SITE_URL}/${r.slug}`, priority: '0.85' })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`Prerendered ${ROUTES.length} static route pages and sitemap.xml into dist/.`);
}

prerender();
