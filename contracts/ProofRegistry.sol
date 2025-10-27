// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofRegistry
 * @dev On-chain registry for FHE Analytics aggregate proof digests
 * Stores daily encrypted analytics proofs on Sepolia testnet
 */
contract ProofRegistry {
    struct Proof {
        bytes32 digest;        // SHA-256 hash of aggregated metrics
        uint256 timestamp;     // When the proof was anchored
        string ipfsCid;        // IPFS CID of full proof data
        address origin;        // Origin owner address
        uint256 blockNumber;   // Block number of anchoring
    }

    // Mapping: originId => day => Proof
    mapping(string => mapping(uint256 => Proof)) public proofs;
    
    // Mapping: originId => owner address
    mapping(string => address) public originOwners;
    
    // Events
    event ProofAnchored(
        string indexed originId,
        uint256 indexed day,
        bytes32 digest,
        string ipfsCid,
        address indexed origin
    );
    
    event OriginRegistered(
        string indexed originId,
        address indexed owner
    );

    /**
     * @dev Register an origin with owner address
     * @param originId Unique origin identifier
     * @param owner Owner wallet address
     */
    function registerOrigin(string memory originId, address owner) external {
        require(originOwners[originId] == address(0), "Origin already registered");
        require(owner != address(0), "Invalid owner address");
        
        originOwners[originId] = owner;
        emit OriginRegistered(originId, owner);
    }

    /**
     * @dev Anchor an aggregate proof digest on-chain
     * @param originId Origin identifier
     * @param day Unix timestamp of the day (midnight UTC)
     * @param digest SHA-256 hash of aggregated encrypted metrics
     * @param ipfsCid IPFS CID containing full proof data
     */
    function anchorProof(
        string memory originId,
        uint256 day,
        bytes32 digest,
        string memory ipfsCid
    ) external {
        address owner = originOwners[originId];
        require(owner != address(0), "Origin not registered");
        require(msg.sender == owner, "Only origin owner can anchor proofs");
        require(proofs[originId][day].timestamp == 0, "Proof already anchored for this day");
        
        proofs[originId][day] = Proof({
            digest: digest,
            timestamp: block.timestamp,
            ipfsCid: ipfsCid,
            origin: owner,
            blockNumber: block.number
        });
        
        emit ProofAnchored(originId, day, digest, ipfsCid, owner);
    }

    /**
     * @dev Verify a proof exists for a given origin and day
     * @param originId Origin identifier
     * @param day Unix timestamp of the day
     * @return exists Whether proof exists
     * @return digest The proof digest
     * @return ipfsCid The IPFS CID
     */
    function verifyProof(
        string memory originId,
        uint256 day
    ) external view returns (bool exists, bytes32 digest, string memory ipfsCid) {
        Proof memory proof = proofs[originId][day];
        exists = proof.timestamp > 0;
        digest = proof.digest;
        ipfsCid = proof.ipfsCid;
    }

    /**
     * @dev Get full proof details
     * @param originId Origin identifier
     * @param day Unix timestamp of the day
     * @return proof The complete proof struct
     */
    function getProof(
        string memory originId,
        uint256 day
    ) external view returns (Proof memory proof) {
        return proofs[originId][day];
    }

    /**
     * @dev Get origin owner
     * @param originId Origin identifier
     * @return owner The owner address
     */
    function getOriginOwner(string memory originId) external view returns (address owner) {
        return originOwners[originId];
    }
}
