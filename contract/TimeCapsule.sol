// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract TimeCapsule {
    event Saved(address indexed owner, uint256 id, uint256 unlockTime, string encrypted);

    struct Capsule {
        address owner;
        uint256 unlockTime;
        string encrypted;
    }

    uint256 public nextId;
    mapping(uint256 => Capsule) public capsules;

    function save(string memory encrypted, uint256 unlockTime) external returns (uint256 id) {
        require(unlockTime > block.timestamp, "Unlock time must be in the future");
        id = nextId++;
        capsules[id] = Capsule(msg.sender, unlockTime, encrypted);
        emit Saved(msg.sender, id, unlockTime, encrypted);
    }

    function get(uint256 id) external view returns (address owner, uint256 unlockTime, string memory encrypted) {
        Capsule memory c = capsules[id];
        return (c.owner, c.unlockTime, c.encrypted);
    }
}
