import { create, mplCore, transfer, fetchAsset } from "@metaplex-foundation/mpl-core";
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  signerIdentity,
  sol,
  Umi,
  PublicKey,
  publicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import fs from "fs";
import path from "path";

const DEVNET_URL = "https://api.devnet.solana.com";
const IRYS_URL = "https://devnet.irys.xyz";
const pathToWallet = "./wallet_keypair.json";

// wallet
// load keypair to umi
const loadKeypairToUmi = async (): Promise<Umi> => {
  const umi = createUmi(DEVNET_URL)
    .use(mplCore())
    .use(
      irysUploader({
        address: IRYS_URL,
      })
    );

  // Read the wallet file (JSON array of numbers)
  const walletFile = fs.readFileSync(pathToWallet, "utf-8");
  const walletArray = JSON.parse(walletFile);

  // Convert your walletFile onto a keypair.
  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(walletArray)
  );

  // Load the keypair into umi.
  umi.use(keypairIdentity(keypair));

  return umi;
};

const uploadImageToArweave = async (umi: Umi) => {

  // use `fs` to read file via a string path.
  // You will need to understand the concept of pathing from a computing perspective.
  const imageFile = fs.readFileSync(
    path.join(process.cwd(), "assets", "angry-tiger.jpg")
  );


  const umiImageFile = createGenericFile(imageFile, "angry-tiger.jpg", {
    tags: [{ name: "Content-Type", value: "image/jpeg" }],
  });


  const imageUri = await umi.uploader.upload([umiImageFile]).catch((err) => {
    throw new Error(err);
  });

  console.log("Image uploaded to Arweave:", imageUri);
  return imageUri[0];
};

const getMetadata = (imageUri: string) => {
  return {
    name: "Angry Tiger",
    description: "Angry Tiger!",
    image: imageUri,
    external_url: "https://example.com",
    attributes: [
      {
        trait_type: "Unbreakable",
        value: "Yes",
      },
      {
        trait_type: "Indestructible",
        value: "Yes",
      },
    ],
    properties: {
      files: [
        {
          uri: imageUri,
          type: "image/jpeg",
        },
      ],
      category: "image",
    },
  };
};

const uploadMetadataToArweave = async (metadata: any, umi: Umi) => {

  const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
    throw new Error(err);
  });

  console.log("Metadata uploaded to Arweave:", metadataUri);
  return metadataUri;
};

const mintNft = async (metadataUri: string, umi: Umi) => {
  const asset = generateSigner(umi);
  const tx = await create(umi, {
    asset,
    name: "Angry Tiger",
    uri: metadataUri,
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(tx.signature)[0];
  
  return {
    signature,
    assetPublicKey: asset.publicKey,
  };
};

const transferNft = async (assetPublicKey: PublicKey, recipientAddress: string, umi: Umi) => {
  // Wait a bit for the asset account to be available on-chain
  console.log("Waiting for asset to be available on-chain...");
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  // Retry fetching the asset with exponential backoff
  let asset;
  let retries = 5;
  let delay = 1000; // Start with 1 second delay
  
  while (retries > 0) {
    try {
      asset = await fetchAsset(umi, assetPublicKey);
      break; // Success, exit the loop
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw new Error(`Failed to fetch asset after multiple attempts: ${error}`);
      }
      console.log(`Asset not found yet, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  // Convert recipient address string to PublicKey
  const recipientPublicKey = publicKey(recipientAddress);
  
  // Transfer the NFT to the recipient
  const tx = await transfer(umi, {
    asset,
    newOwner: recipientPublicKey,
  }).sendAndConfirm(umi);
  
  const signature = base58.deserialize(tx.signature)[0];
  
  console.log("\nNFT Transferred");
  console.log("View Transfer Transaction on Solana Explorer");
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  
  return signature;
};

// Create the wrapper function
const createNft = async () => {
  const umi = await loadKeypairToUmi();

  const imageUri = await uploadImageToArweave(umi);

  const metadata = getMetadata(imageUri);

  const metadataUri = await uploadMetadataToArweave(metadata, umi);

  const { signature, assetPublicKey } = await mintNft(metadataUri, umi);

  // Log out the signature and the links to the transaction and the NFT.
  console.log("\nNFT Created");
  console.log("View Transaction on Solana Explorer");
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log("\n");
  console.log("View NFT on Metaplex Explorer");
  console.log(
    `https://core.metaplex.com/explorer/${assetPublicKey}?env=devnet`
  );
};

// run the wrapper function
createNft();