module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const today = new Date().toISOString().split('T')[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://pawpickai.vercel.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ko" href="https://pawpickai.vercel.app/" />
    <xhtml:link rel="alternate" hreflang="en" href="https://pawpickai.vercel.app/" />
  </url>
  <url>
    <loc>https://pawpickai.vercel.app/contact.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://pawpickai.vercel.app/privacy.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://pawpickai.vercel.app/terms.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://pawpickai.vercel.app/%EA%B0%95%EC%95%84%EC%A7%80-%EB%B0%A5-%EC%95%88%EB%A8%B9%EC%96%B4%EC%9A%94.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://pawpickai.vercel.app/%EA%B0%95%EC%95%84%EC%A7%80-%EC%98%81%EC%96%91%EC%A0%9C-%EC%B6%94%EC%B2%9C.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://pawpickai.vercel.app/%EA%B3%A0%EC%96%91%EC%9D%B4-%EA%B5%AC%ED%86%A0-%EC%9B%90%EC%9D%B8.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://pawpickai.vercel.app/%EB%B0%98%EB%A0%A4%EB%8F%99%EB%AC%BC-%EC%82%AC%EB%A3%8C-%EC%84%A0%ED%83%9D%EB%B2%95.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  res.status(200).send(sitemap);
};
