/**
 * Compile and Deploy ProofRegistry contract to Sepolia testnet
 * This script compiles the Solidity contract and deploys it using viem
 */

import solc from 'solc';
import * as fs from 'fs';
import * as path from 'path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
  console.log('🔨 FHE-Analytics Contract Deployment');
  console.log('=====================================\n');

  // Check for private key
  let privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in environment');
    console.error('   Add it to Replit Secrets: Tools → Secrets');
    process.exit(1);
  }

  // Clean and validate private key
  privateKey = privateKey.trim();
  
  // Add 0x prefix if missing
  if (!privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`;
  }

  // Validate length (should be 66 characters: 0x + 64 hex chars)
  if (privateKey.length !== 66) {
    console.error('❌ Invalid private key format');
    console.error(`   Expected 66 characters (0x + 64 hex), got ${privateKey.length}`);
    console.error('   Make sure your private key is a valid 32-byte hex string');
    process.exit(1);
  }

  const finalPrivateKey = privateKey as `0x${string}`;

  // Create account from private key
  const account = privateKeyToAccount(finalPrivateKey);
  
  console.log('📋 Deployment Details:');
  console.log('   Network: Sepolia Testnet');
  console.log('   Deployer:', account.address);
  
  // Create clients - using Cloudflare's reliable RPC
  const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Check balance
  console.log('\n💰 Checking balance...');
  const balance = await publicClient.getBalance({ address: account.address });
  const balanceEth = Number(balance) / 1e18;
  console.log('   Balance:', balanceEth.toFixed(4), 'ETH');

  if (balance === 0n) {
    console.error('\n❌ Deployer has no ETH!');
    console.error('   Get testnet ETH from: https://sepoliafaucet.com/');
    console.error('   Your address:', account.address);
    process.exit(1);
  }

  // Read contract source code
  console.log('\n📖 Reading contract source...');
  const contractPath = path.join(process.cwd(), 'contracts/ProofRegistry.sol');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  // Prepare compiler input
  const input = {
    language: 'Solidity',
    sources: {
      'ProofRegistry.sol': {
        content: contractSource,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  };

  // Compile contract
  console.log('⚙️  Compiling contract...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for compilation errors
  if (output.errors) {
    const hasErrors = output.errors.some((e: any) => e.severity === 'error');
    if (hasErrors) {
      console.error('\n❌ Compilation errors:');
      output.errors.forEach((error: any) => {
        console.error('  ', error.formattedMessage);
      });
      process.exit(1);
    }
  }

  const contract = output.contracts['ProofRegistry.sol']['ProofRegistry'];
  const bytecode = `0x${contract.evm.bytecode.object}` as `0x${string}`;
  const abi = contract.abi;

  console.log('   ✅ Contract compiled successfully');
  console.log('   Bytecode size:', bytecode.length, 'characters');

  // Deploy contract
  console.log('\n🚀 Deploying contract to Sepolia...');
  console.log('   This may take 30-60 seconds...');

  try {
    const hash = await walletClient.deployContract({
      abi,
      bytecode,
      account,
    });

    console.log('   Transaction hash:', hash);
    console.log('   Waiting for confirmation...');

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log('\n✅ Contract deployed successfully!');
    console.log('=====================================');
    console.log('📝 Contract Address:', receipt.contractAddress);
    console.log('🔗 Etherscan:', `https://sepolia.etherscan.io/address/${receipt.contractAddress}`);
    console.log('📊 Block Number:', receipt.blockNumber.toString());
    console.log('⛽ Gas Used:', receipt.gasUsed.toString());
    console.log('=====================================\n');

    // Save contract address and ABI
    const contractData = {
      address: receipt.contractAddress,
      abi,
      network: 'sepolia',
      deployedAt: new Date().toISOString(),
      deployer: account.address,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    };

    const outputPath = path.join(process.cwd(), 'contracts/deployed.json');
    fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
    
    console.log('💾 Contract info saved to: contracts/deployed.json');
    console.log('\n📋 Next steps:');
    console.log('   1. Add CONTRACT_ADDRESS to Secrets:');
    console.log(`      ${receipt.contractAddress}`);
    console.log('   2. Test the contract on Etherscan');
    console.log('   3. Register origins and anchor proofs!\n');

    return receipt.contractAddress;

  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.message.includes('insufficient funds')) {
      console.error('   You need more Sepolia ETH. Get it from: https://sepoliafaucet.com/');
    }
    process.exit(1);
  }
}

main().catch(console.error);
