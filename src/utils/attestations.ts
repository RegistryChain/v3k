
import { EAS_ADDRESS } from "@app/constants/addresses";
import { EAS }  from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";

const BASE_RPC_URL = "https://mainnet.base.org"

const provider = new ethers.JsonRpcProvider(BASE_RPC_URL)

export async function getAttestationData(uid: string){
    try{
      const eas = new EAS(EAS_ADDRESS);
      eas.connect(provider);
      return await eas.getAttestation(uid);
    } catch(error){
      console.error("Error fetching Metadata: ", error)
      throw error;
    }
  }