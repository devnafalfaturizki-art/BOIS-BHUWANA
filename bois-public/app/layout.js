export default function Layout({ children }) {
  return (
    <html lang="id">
      <body>
        <header style={{ background: '#f0f0f0', padding: '1rem' }}>
          <h1>BOIS Public</h1>
          <nav>
            <a href="/">Home</a> | <a href="/positions">Organisasi</a> | <a href="/officers">Personel</a> | <a href="/posts">Berita</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}