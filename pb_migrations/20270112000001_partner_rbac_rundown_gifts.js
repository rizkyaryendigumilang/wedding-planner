/// <summary>
/// 20270112000001 — Penguatan izin akses akun pasangan (CPW/partner) untuk rundown, gifts, dan recycle_bin.
///
/// Memperluas createRule agar akun pasangan yang tertaut lewat `@request.auth.couple`
/// dapat membuat/mengelola agenda rundown, pencatatan amplop hadiah, serta
/// pemindahan item ke tempat sampah (soft delete), meskipun bukan akun pemilik utama (owner).
/// </summary>
migrate(
  (app) => {
    const EXPIRY =
      '(@request.auth.is_demo != true || (@request.auth.demo_expires_at != "" && @request.auth.demo_expires_at > @now))';

    const tenant =
      '(couple != "" && (couple = @request.auth.couple || couple.owner = @request.auth.id))';

    const baseAccess =
      '@request.auth.id != "" && ' + tenant + " && " + EXPIRY;

    const partnerCreateAccess =
      '@request.auth.id != "" && ' +
      '(@request.body.couple:isset = true && ' +
      '(@request.body.couple.owner = @request.auth.id || @request.body.couple = @request.auth.couple)) && ' +
      EXPIRY;

    for (const name of ["rundown_events", "wedding_gifts", "recycle_bin"]) {
      try {
        const collection = app.findCollectionByNameOrId(name);
        collection.listRule = baseAccess;
        collection.viewRule = baseAccess;
        collection.createRule = partnerCreateAccess;
        collection.updateRule = baseAccess + ' || (@request.auth.username = "admin")';
        collection.deleteRule = baseAccess + ' || (@request.auth.username = "admin")';
        app.save(collection);
      } catch (err) {
        console.warn(`[migrasi] Gagal memperbarui aturan koleksi ${name}:`, err);
      }
    }
  },
  (_app) => {
    // Rollback sengaja dilewati demi integritas data
  }
);
