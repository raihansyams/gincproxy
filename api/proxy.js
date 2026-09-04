// api/proxy.js
//
// Proxy generik ala corsproxy.io. Format pemakaian sama persis:
//
//   https://gincproxy.vercel.app/api/proxy?url=https%3A%2F%2Fenka.network%2Fapi%2Fuid%2F8102988371
//
// (dan berkat vercel.json, juga bisa lewat root:
//   https://gincproxy.vercel.app/?url=https%3A%2F%2Fenka.network%2Fapi%2Fuid%2F8102988371 )
//
// Bedanya dari corsproxy.io murni: di sini host tujuan dibatasi lewat
// ALLOWED_HOSTS di bawah. Ini supaya proxy-mu sendiri tidak dijadikan
// "proxy umum" gratis oleh orang lain yang menemukan URL-nya (yang bisa
// bikin kuota/tagihan Vercel-mu jebol). Kalau target-nya bukan dari
// domain di daftar ini, request ditolak dengan 403.
//
// Mau nambah situs lain yang boleh diproxy? Tinggal tambah ke array ini.
const ALLOWED_HOSTS = [
  "enka.network",
];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "GET") {
      return jsonError("Method tidak didukung, pakai GET.", 405);
    }

    const reqUrl = new URL(request.url);
    const targetRaw = reqUrl.searchParams.get("url");

    if (!targetRaw) {
      return jsonError("Parameter ?url= wajib diisi.", 400);
    }

    let target;
    try {
      target = new URL(targetRaw);
    } catch {
      return jsonError("URL tujuan tidak valid (pastikan sudah di-encode dengan benar).", 400);
    }

    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return jsonError("Skema URL tidak didukung.", 400);
    }

    if (!ALLOWED_HOSTS.includes(target.hostname)) {
      return jsonError(`Host "${target.hostname}" tidak diizinkan lewat proxy ini.`, 403);
    }

    try {
      const upstream = await fetch(target.toString(), {
        headers: {
          "User-Agent": "GincProxy/1.0 (+https://gincproxy.vercel.app)",
          "Accept": "application/json",
        },
      });

      const bodyText = await upstream.text();
      const status = upstream.status >= 200 && upstream.status < 600 ? upstream.status : 502;

      return new Response(bodyText, {
        status,
        headers: {
          ...corsHeaders(),
          "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      return jsonError(
        "Gagal menghubungi server tujuan: " + (err && err.message ? err.message : String(err)),
        502
      );
    }
  },
};
