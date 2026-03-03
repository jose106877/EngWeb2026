const pug = require('pug');

// Helper para compilar e renderizar
function renderPug(fileName, data) {
    return pug.renderFile(`./views/${fileName}.pug`, data);
}

exports.emdListPage = (tlist, d) => renderPug('index', { list: tlist, date: d });
exports.emdPage = (t, d) => renderPug('emd', { emd: t, date: d });
exports.errorPage = (msg, d) => renderPug('error', { message: msg, date: d });
exports.emdFormPage = (d) => renderPug('form', { date: d });
exports.emdFormEditPage = (t, d) => renderPug('form', { emd: t, date: d });
exports.statsPage = (stats, d) => renderPug('stats', { stats: stats, date: d });
