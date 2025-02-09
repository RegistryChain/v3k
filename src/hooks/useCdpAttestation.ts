// import type { Address, ByteArray } from "viem";
import {decodeAbiParameters} from "viem";
import { Attestation } from "@ethereum-attestation-service/eas-sdk";
import { useReadContract } from 'wagmi'
import { base } from "viem/chains";
import {ACCOUNT_VERIFICATION_SCHEMA_ID, COINBASE_ATTESTATION_ADDRESS, COUNTRY_VERIFICATION_SCHEMA_ID, ONE_VERIFICATION_SCHEMA_ID} from '../constants/addresses'
import { useEffect, useMemo, useState } from "react";

import ATTESTATION_ABI from '@app/constants/attestation.abi.json'
import { getAttestationData } from "@app/utils/attestations";

export const useAttestationUid = (walletAddress: string|undefined, schemaId: string) => {
    const result = useReadContract({
        address: COINBASE_ATTESTATION_ADDRESS,
        abi: ATTESTATION_ABI,
        functionName: 'getAttestationUid',
        args: [walletAddress, schemaId],
        chainId: base.id
      })
    return result
}

export const useAttestationData = (uid) => {
  const [attestation, setAttestation] = useState<Attestation | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(undefined);

  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAttestationData(uid);
        setAttestation(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid]);
  return { attestation, loading, error };
}

export const useAttestations = (userAddress?: string) => {
  const {data: accUid, isLoading: accUidLoading} = useAttestationUid(userAddress, ACCOUNT_VERIFICATION_SCHEMA_ID)
  const {data: countryUid, isLoading: countryUidLoading} = useAttestationUid(userAddress, COUNTRY_VERIFICATION_SCHEMA_ID)
  const {data: oneUid, isLoading: oneUidLoading} = useAttestationUid(userAddress, ONE_VERIFICATION_SCHEMA_ID)

  const {attestation: accAttestation, loading: accLoading} = useAttestationData(accUid)
  const {attestation: countryAttestation, loading: countryLoading} = useAttestationData(countryUid)
  const {attestation: oneAttestation, loading: oneLoading} = useAttestationData(oneUid)

  const isVerified = useDecodeSingle(accAttestation?.data, "bool")
  const countryCode = useDecodeSingle(countryAttestation?.data, "string")
  const isOneVerified = useDecodeSingle(oneAttestation?.data, "bool")

  return {
    accUid,
    accUidLoading,
    countryUid,
    countryUidLoading,
    oneUid,
    oneUidLoading,
    accAttestation,
    countryAttestation,
    oneAttestation,
    accLoading,
    countryLoading,
    oneLoading,
    isVerified,
    countryCode,
    isOneVerified
  }
}

export const useDecodeSingle = (data: string|undefined, type: string) => {
  return useMemo(() => {
    if (!data || data === "0x") return
    return decodeAbiParameters([{name: "result", type}], data as `0x${string}`)[0]
  }, [data])
}