import { alchemy } from "@/lib/clients";
import useSWR from "swr";
import { getAlchemyImageSrc, getNftAsset } from "@/lib/utils";

function formatImageReturn(imageData?: string | string[]): string[] {
  if (!imageData) {
    return ["/no-img.jpg"];
  }

  return typeof imageData === "string" ? [imageData] : imageData;
}

interface CustomImplementation {
  contractAddress: `0x${string}`;
}

export const useNft = ({
  tokenId,
  apiEndpoint,
  refreshInterval = 120000,
  cacheKey,
  contractAddress,
  hasCustomImplementation,
}: {
  tokenId: number;
  apiEndpoint?: string;
  refreshInterval?: number;
  cacheKey?: string;
  contractAddress: `0x${string}`;
  hasCustomImplementation: boolean;
}) => {
  let key = null;
  if (hasCustomImplementation) key = cacheKey ?? `getNftAsset-${tokenId}`;

  const {
    data: customNftData,
    isLoading: customNftLoading,
    error: customNftError,
  } = useSWR(key, () => getNftAsset(tokenId, apiEndpoint), {
    refreshInterval: refreshInterval,
    shouldRetryOnError: false,
    retry: 0,
  });

  if (customNftError) console.log("CUSTOM NFT DATA FETCH ERROR: ", customNftError);

  const { data: nftMetadata, isLoading: nftMetadataLoading } = useSWR(
    `nftMetadata/${contractAddress}/${tokenId}`,
    (url: string) => {
      const [, contractAddress, tokenId] = url.split("/");
      return alchemy.nft.getNftMetadataBatch([{ contractAddress, tokenId }]);
    }
  );

  return {
    data:
      hasCustomImplementation && !customNftError
        ? formatImageReturn(customNftData)
        : formatImageReturn(getAlchemyImageSrc(nftMetadata?.[0])),
    nftMetadata: nftMetadata?.[0],
    loading: hasCustomImplementation ? customNftLoading : nftMetadataLoading,
  };
};
