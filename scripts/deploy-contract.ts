/**
 * Deploy ProofRegistry contract to Sepolia testnet
 * 
 * Usage:
 *   1. Set DEPLOYER_PRIVATE_KEY in secrets
 *   2. Ensure deployer has Sepolia ETH (get from faucet)
 *   3. Run: tsx scripts/deploy-contract.ts
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';

// Contract bytecode (compiled Solidity)
// This will be generated after compiling the contract
const PROOF_REGISTRY_BYTECODE = '0x'; // Placeholder - needs compilation

const PROOF_REGISTRY_ABI = parseAbi([
  'function registerOrigin(string memory originId, address owner) external',
  'function anchorProof(string memory originId, uint256 day, bytes32 digest, string memory ipfsCid) external',
  'function verifyProof(string memory originId, uint256 day) external view returns (bool exists, bytes32 digest, string memory ipfsCid)',
  'function getProof(string memory originId, uint256 day) external view returns (tuple(bytes32 digest, uint256 timestamp, string ipfsCid, address origin, uint256 blockNumber) proof)',
  'function getOriginOwner(string memory originId) external view returns (address owner)',
  'event ProofAnchored(string indexed originId, uint256 indexed day, bytes32 digest, string ipfsCid, address indexed origin)',
  'event OriginRegistered(string indexed originId, address indexed owner)',
]) as const;

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  
  if (!privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in environment');
    console.log('   Get testnet ETH from: https://sepoliafaucet.com/');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://eth-sepolia.g.alchemy.com/v2/demo'),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http('https://eth-sepolia.g.alchemy.com/v2/demo'),
  });

  console.log('🚀 Deploying ProofRegistry to Sepolia...');
  console.log('   Deployer:', account.address);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('   Balance:', Number(balance) / 1e18, 'ETH');

  if (balance === 0n) {
    console.error('❌ Deployer has no ETH. Get testnet ETH from:');
    console.error('   https://sepoliafaucet.com/');
    process.exit(1);
  }

  // Note: In production, you would compile the Solidity here or import compiled artifacts
  console.log('\n⚠️  Contract deployment requires compilation.');
  console.log('   For manual deployment:');
  console.log('   1. Compile ProofRegistry.sol using Remix (https://remix.ethereum.org/)');
  console.log('   2. Deploy to Sepolia manually');
  console.log('   3. Update CONTRACT_ADDRESS in .env');
  
  // Save ABI for later use
  const abiPath = path.join(process.cwd(), 'contracts/ProofRegistry.abi.json');
  fs.writeFileSync(abiPath, JSON.stringify(PROOF_REGISTRY_ABI, null, 2));
  console.log('\n✅ ABI saved to:', abiPath);
  
  console.log('\n📝 After deployment, add these to your secrets:');
  console.log('   CONTRACT_ADDRESS=<deployed_contract_address>');
  console.log('   DEPLOYER_PRIVATE_KEY=<your_private_key>');
}

main().catch(console.error);
