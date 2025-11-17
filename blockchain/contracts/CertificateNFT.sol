// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, Ownable {
    uint256 private _tokenId;
    mapping(uint256 => string) private _tokenURIs;

    event CertificateMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("CertificateNFT", "CERT") Ownable() {}

    function mintCertificate(address to, string memory tokenURI_) external onlyOwner returns (uint256) {
        unchecked { _tokenId++; }
        uint256 newId = _tokenId;

        _safeMint(to, newId);
        _tokenURIs[newId] = tokenURI_;

        emit CertificateMinted(to, newId, tokenURI_);

        return newId;
    }

    function tokenURI(uint256 tokenId_) public view override returns (string memory) {
        require(_ownerOf(tokenId_) != address(0), "NOT_MINTED");
        return _tokenURIs[tokenId_];
    }
}
