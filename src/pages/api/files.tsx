// import { NextResponse, type NextRequest } from "next/server";
// import { PinataSDK } from 'pinata'
// export const pinata = new PinataSDK({
//     pinataJwt: `${process.env.PINATA_JWT}`,
//     pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
// })

// export default async function POST(request: NextRequest) {
//     try {
//         const files = await request.formData()
//         const file: File = files.get("file") as unknown as File;
//         console.log("file")
//         console.log(file)

//         const { cid } = await pinata.upload.public.file(file)
//         const url = await pinata.gateways.public.convert(cid);
//         console.log("url")
//         console.log(url)
//         console.log("cid")
//         console.log(cid)
//         return NextResponse.json(url, { status: 200 });
//         // console.log(e);
//     } catch (e) {
//         console.log(e);
//         return NextResponse.json(
//             { error: "error parsing" },
//             { status: 400 }
//         );
//     }
// }