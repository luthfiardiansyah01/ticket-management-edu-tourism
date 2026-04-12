const { createClient } = require('@libsql/client');

async function main() {
  console.log('1. Membuat koneksi ke local.db...');
  const client = createClient({ url: 'file:local.db' });

  try {
    console.log('2. Mengaktifkan WAL mode...');
    await client.execute('PRAGMA journal_mode=WAL;');
    console.log('3. Mengaktifkan Busy Timeout...');
    await client.execute('PRAGMA busy_timeout=5000;');
    
    console.log('4. Mencoba TULIS ke database...');
    await client.execute('CREATE TABLE IF NOT EXISTS test_tes (id INTEGER PRIMARY KEY, nama TEXT)');
    await client.execute("INSERT INTO test_tes (nama) VALUES ('sukses')");
    
    console.log('5. Membaca data...');
    const res = await client.execute('SELECT * FROM test_tes');
    console.log('6. HASIL:', res.rows);
    
    console.log('✅ DATABASE BERHASIL DITULIS! Masalah ada di Jest/Next.js.');
  } catch (err) {
    console.error('❌ GAGAL MENULIS:', err.message);
    console.error('Ini berarti masalah ada di Windows/Antivirus/Kunci File.');
  }
}

main();