export async function onRequestGet(context) {
  const { request } = context;
  const url = "https://dkhpapi.uit.edu.vn/courses";
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Thiếu Authorization Token" }), {
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
