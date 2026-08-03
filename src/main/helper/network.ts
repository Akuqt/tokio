import dns from "dns";

export async function checkInternetConnection() {
  return new Promise<boolean>((res) => {
    dns.lookup("google.com", { family: 4, hints: 0 }, (err, address) => {
      if (err && !address) {
        res(false);
      } else {
        res(true);
      }
    });
  });
}
