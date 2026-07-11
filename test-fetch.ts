async function main() {
    const res = await fetch('http://localhost:3000/api/secure-image/f989d043-bbbd-4989-8172-062fa95f5199.jpg');
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    if (!res.ok) {
        console.log("Body:", await res.text());
    } else {
        const buffer = await res.arrayBuffer();
        console.log("Downloaded buffer size:", buffer.byteLength);
    }
}
main().catch(console.error);
