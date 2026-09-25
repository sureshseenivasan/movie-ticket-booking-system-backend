import dns from "node:dns/promises";

async function testDNS() {
  try {
    const records = await dns.resolveSrv(
      "_mongodb._tcp.cluster0.bmpmfbi.mongodb.net"
    );

    console.log("DNS Records:");
    console.log(records);
  } catch (error) {
    console.error("DNS Error:", error);
  }
}

testDNS();
