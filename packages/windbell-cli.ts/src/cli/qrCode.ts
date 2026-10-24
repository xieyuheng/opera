import QRCode from "qrcode"

export async function printQrCode(url: string): Promise<void> {
  const qr = await QRCode.toString(url, {
    type: "terminal",
    small: true,
    margin: 2,
    errorCorrectionLevel: "M",
  })

  process.stdout.write(`\n${qr}\n`)
}
