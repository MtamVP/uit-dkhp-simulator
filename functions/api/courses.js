export async function onRequestGet(context) {
  const { request, env } = context;
  const url = "https://dkhpapi.uit.edu.vn/courses";
  let authHeader = request.headers.get("Authorization");
  let usedShared = false;
  
  if (authHeader) {
    if (env.DKHP_KV) {
      await env.DKHP_KV.put("SHARED_TOKEN", authHeader);
    }
  } else {
    if (env.DKHP_KV) {
      authHeader = await env.DKHP_KV.get("SHARED_TOKEN");
      usedShared = true;
    }
  }

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Chưa có ai đóng góp Token. Vui lòng dán Token của bạn để chia sẻ cho mọi người!" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
        "Origin": "https://dkhp.uit.edu.vn",
        "Referer": "https://dkhp.uit.edu.vn/"
      }
    });

    if (response.status === 401) {
      if (usedShared && env.DKHP_KV) {
        await env.DKHP_KV.delete("SHARED_TOKEN");
      }
      return new Response(JSON.stringify({ error: usedShared ? "Token cộng đồng đã hết hạn. Xin hãy đóng góp Token mới!" : "Token của bạn đã hết hạn hoặc không hợp lệ!" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
