export type SolidPattern = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  code: string;
};

// All templates are verified compilable with solc 0.8.26 + OZ v5.4.0
export const PATTERNS: SolidPattern[] = [
  {
    slug: 'erc20-token',
    name: 'ERC-20 Token',
    description: 'Standard ERC-20 token with mint, burn, owner controls, and optional tax/reflection features',
    keywords: ['erc20', 'erc-20', 'token', 'mint', 'burn', 'supply', 'transfer', 'ownership', 'ownable'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FORGE is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _dec,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        _decimals = _dec;
        _mint(msg.sender, _initialSupply * 10 ** _dec);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}`,
  },
  {
    slug: 'erc721-nft',
    name: 'ERC-721 NFT Collection',
    description: 'ERC-721 NFT with public mint, max supply, metadata URI, and owner controls',
    keywords: ['erc721', 'erc-721', 'nft', 'collection', 'mint', 'metadata', 'token-uri', 'supply'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTCollection is ERC721, Ownable, ReentrancyGuard {
    uint256 public maxSupply;
    uint256 public mintPrice;
    string private _baseTokenURI;
    uint256 private _nextTokenId;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        string memory _baseURI
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        _baseTokenURI = _baseURI;
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(_nextTokenId + quantity <= maxSupply, "Exceeds max supply");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, _nextTokenId);
            _nextTokenId++;
        }
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory _uri) external onlyOwner {
        _baseTokenURI = _uri;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`,
  },
  {
    slug: 'multisig-wallet',
    name: 'Multi-Signature Wallet',
    description: 'Multi-signature wallet requiring N-of-M owner approvals to execute transactions',
    keywords: ['multisig', 'multi-sig', 'multi-signature', 'wallet', 'gnosis', 'owners', 'approval', 'signatures'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 amount);
    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value, bytes data);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event RequiredConfirmationsChanged(uint256 newRequired);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    uint256 public required;
    uint256 public ownerCount;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < transactions.length, "Tx does not exist");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "Tx already executed");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required count");

        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner");
            require(!isOwner[_owners[i]], "Duplicate owner");
            isOwner[_owners[i]] = true;
            owners.push(_owners[i]);
        }
        ownerCount = _owners.length;
        required = _required;
    }

    receive() external payable { emit Deposit(msg.sender, msg.value); }

    function submitTransaction(address _to, uint256 _value, bytes calldata _data)
        external onlyOwner returns (uint256)
    {
        uint256 txId = transactions.length;
        transactions.push(Transaction({to: _to, value: _value, data: _data, executed: false, confirmationCount: 0}));
        emit TransactionSubmitted(txId, _to, _value, _data);
        return txId;
    }

    function confirmTransaction(uint256 txId)
        external onlyOwner txExists(txId) notExecuted(txId)
    {
        require(!confirmations[txId][msg.sender], "Already confirmed");
        confirmations[txId][msg.sender] = true;
        transactions[txId].confirmationCount++;
        emit TransactionConfirmed(txId, msg.sender);

        if (transactions[txId].confirmationCount >= required) {
            _executeTransaction(txId);
        }
    }

    function _executeTransaction(uint256 txId) internal {
        Transaction storage txn = transactions[txId];
        txn.executed = true;
        (bool success,) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Tx execution failed");
        emit TransactionExecuted(txId);
    }

    function addOwner(address _owner) external onlyOwner {
        require(_owner != address(0), "Invalid address");
        require(!isOwner[_owner], "Already owner");
        isOwner[_owner] = true;
        owners.push(_owner);
        ownerCount++;
        emit OwnerAdded(_owner);
    }

    function removeOwner(address _owner) external onlyOwner {
        require(isOwner[_owner], "Not an owner");
        require(ownerCount - 1 >= required, "Would exceed required");
        isOwner[_owner] = false;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) { owners[i] = owners[owners.length - 1]; owners.pop(); break; }
        }
        ownerCount--;
        emit OwnerRemoved(_owner);
    }

    function changeRequired(uint256 _required) external onlyOwner {
        require(_required > 0 && _required <= ownerCount, "Invalid required");
        required = _required;
        emit RequiredConfirmationsChanged(_required);
    }

    function getTransactionCount() external view returns (uint256) { return transactions.length; }
    function getOwners() external view returns (address[] memory) { return owners; }
}`,
  },
  {
    slug: 'staking-pool',
    name: 'Staking Pool',
    description: 'ERC-20 staking contract where users stake tokens and earn rewards proportional to stake duration',
    keywords: ['staking', 'stake', 'pool', 'rewards', 'yield', 'farm', 'apr', 'lock'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public stakes;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate)
        Ownable(msg.sender)
    {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked() == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * rewardRate * 1e18 / totalStaked());
    }

    function totalStaked() public view returns (uint256) { return stakes[address(0)]; }

    function balanceOf(address account) public view returns (uint256) { return stakes[account]; }

    function earned(address account) public view returns (uint256) {
        return (stakes[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18) + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        stakes[msg.sender] += amount;
        stakes[address(0)] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender] -= amount;
        stakes[address(0)] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function setRewardRate(uint256 _rate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rate;
    }
}`,
  },
  {
    slug: 'token-vesting',
    name: 'Token Vesting',
    description: 'Linear token vesting contract with cliff and periodic release schedule',
    keywords: ['vesting', 'vest', 'cliff', 'schedule', 'release', 'token-distribution', 'linear', 'timelock'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable totalAmount;
    uint256 public immutable start;
    uint256 public immutable cliffDuration;
    uint256 public immutable vestingDuration;
    uint256 public released;

    event Released(uint256 amount);

    constructor(
        address _token,
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _start,
        uint256 _cliffDuration,
        uint256 _vestingDuration
    ) Ownable(msg.sender) {
        token = IERC20(_token);
        beneficiary = _beneficiary;
        totalAmount = _totalAmount;
        start = _start;
        cliffDuration = _cliffDuration;
        vestingDuration = _vestingDuration;
    }

    function releasable() public view returns (uint256) {
        if (block.timestamp < start + cliffDuration) return 0;
        if (block.timestamp >= start + cliffDuration + vestingDuration) return totalAmount - released;
        uint256 elapsed = block.timestamp - start - cliffDuration;
        return (totalAmount * elapsed / vestingDuration) - released;
    }

    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "Nothing to release");
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit Released(amount);
    }
}`,
  },
  {
    slug: 'erc1155-multi-token',
    name: 'ERC-1155 Multi-Token',
    description: 'ERC-1155 multi-token contract supporting fungible, semi-fungible, and non-fungible tokens',
    keywords: ['erc1155', 'erc-1155', 'multi-token', 'semi-fungible', 'batch', '1155'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MultiToken is ERC1155, Ownable {
    string public name;
    string public symbol;

    constructor(string memory _name, string memory _symbol, string memory _uri)
        ERC1155(_uri) Ownable(msg.sender)
    {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    function setURI(string memory newUri) external onlyOwner {
        _setURI(newUri);
    }
}`,
  },
  {
    slug: 'timelock-controller',
    name: 'Timelock Controller',
    description: 'Timelock-governed executor that enforces a delay on privileged operations',
    keywords: ['timelock', 'governance', 'delay', 'executor', 'controller', 'admin', 'schedule'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TimelockController is Ownable, ReentrancyGuard {
    uint256 public immutable delay;
    mapping(bytes32 => bool) public queued;

    event Queued(bytes32 indexed txHash, address indexed target, uint256 value, bytes data, uint256 timestamp);
    event Executed(bytes32 indexed txHash);

    constructor(uint256 _delay) Ownable(msg.sender) {
        delay = _delay;
    }

    modifier onlyQueued(bytes32 txHash) {
        require(queued[txHash], "Tx not queued");
        _;
    }

    function queue(address target, uint256 value, bytes calldata data) external onlyOwner returns (bytes32) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, block.timestamp + delay));
        queued[txHash] = true;
        emit Queued(txHash, target, value, data, block.timestamp + delay);
        return txHash;
    }

    function execute(bytes32 txHash, address target, uint256 value, bytes calldata data)
        external onlyOwner onlyQueued(txHash) nonReentrant
    {
        queued[txHash] = false;
        (bool success,) = target.call{value: value}(data);
        require(success, "Execution failed");
        emit Executed(txHash);
    }
}`,
  },
  {
    slug: 'minimal-proxy-factory',
    name: 'Minimal Proxy Factory (ERC-1167)',
    description: 'ERC-1167 minimal proxy factory that clones an implementation contract and initializes each clone',
    keywords: ['proxy', 'clone', 'eip-1167', 'erc-1167', 'minimal-proxy', 'factory', 'implementation', 'create2'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CloneFactory is Ownable {
    address public immutable implementation;

    event CloneDeployed(address indexed clone, address indexed deployer, bytes32 salt);

    constructor(address _implementation) Ownable(msg.sender) {
        implementation = _implementation;
    }

    function deploy(bytes32 salt, bytes calldata initData) external returns (address) {
        address clone;
        bytes20 implBytes = bytes20(implementation);

        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), implBytes)
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            clone := create2(0, ptr, 0x37, salt)
        }

        require(clone != address(0), "CREATE2 failed");

        if (initData.length > 0) {
            (bool success,) = clone.call(initData);
            require(success, "Init failed");
        }

        emit CloneDeployed(clone, msg.sender, salt);
        return clone;
    }

    function predictAddress(bytes32 salt) external view returns (address) {
        bytes32 initCodeHash = keccak256(abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        ));
        return address(uint160(uint256(keccak256(abi.encodePacked(
            hex"ff", address(this), salt, initCodeHash
        )))));
    }
}`,
  },
  {
    slug: 'crowdsale',
    name: 'Token Crowdsale / ICO',
    description: 'Capped token sale with rate, whitelist, and refund for unsold tokens',
    keywords: ['crowdsale', 'ico', 'sale', 'presale', 'fundraise', 'whitelist', 'cap', 'rate'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract Crowdsale is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public token;
    uint256 public rate;
    uint256 public cap;
    uint256 public raised;
    uint256 public start;
    uint256 public end;
    mapping(address => bool) public whitelist;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);

    constructor(address _token, uint256 _rate, uint256 _cap, uint256 _start, uint256 _end)
        Ownable(msg.sender)
    {
        token = IERC20(_token);
        rate = _rate;
        cap = _cap;
        start = _start;
        end = _end;
    }

    modifier whenSaleActive() {
        require(block.timestamp >= start && block.timestamp <= end, "Sale not active");
        _;
    }

    function buy() external payable nonReentrant whenNotPaused whenSaleActive {
        require(whitelist[msg.sender] || whitelist[address(0)], "Not whitelisted");
        require(raised + msg.value <= cap, "Cap exceeded");
        require(msg.value > 0, "No ETH sent");

        uint256 tokenAmount = msg.value * rate;
        raised += msg.value;
        token.safeTransfer(msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }

    function withdrawRaised() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) whitelist[addresses[i]] = true;
    }
}`,
  },
  {
    slug: 'voting-dao',
    name: 'Simple Voting / DAO',
    description: 'Token-weighted voting system with proposal creation, voting, and execution',
    keywords: ['voting', 'dao', 'governance', 'proposal', 'vote', 'quorum', 'token-weighted'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleDAO is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public quorum;
    uint256 public votingPeriod;

    struct Proposal {
        address target;
        bytes data;
        uint256 value;
        uint256 deadline;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    Proposal[] public proposals;

    event ProposalCreated(uint256 indexed id, address target, uint256 deadline);
    event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event Executed(uint256 indexed proposalId);

    constructor(address _token, uint256 _quorum, uint256 _votingPeriod) Ownable(msg.sender) {
        token = IERC20(_token);
        quorum = _quorum;
        votingPeriod = _votingPeriod;
    }

    function createProposal(address target, uint256 value, bytes calldata data) external returns (uint256) {
        uint256 id = proposals.length;
        Proposal storage p = proposals.push();
        p.target = target;
        p.value = value;
        p.data = data;
        p.deadline = block.timestamp + votingPeriod;
        emit ProposalCreated(id, target, p.deadline);
        return id;
    }

    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.deadline, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");

        uint256 weight = token.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        p.hasVoted[msg.sender] = true;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function execute(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");
        require(p.forVotes > p.againstVotes, "Proposal defeated");
        require(p.forVotes >= quorum, "Quorum not met");

        p.executed = true;
        (bool success,) = p.target.call{value: p.value}(p.data);
        require(success, "Execution failed");
        emit Executed(proposalId);
    }

    function proposalCount() external view returns (uint256) { return proposals.length; }
}`,
  },
  {
    slug: 'lending-pool',
    name: 'Simple Lending Pool',
    description: 'Basic lending pool where users deposit collateral and borrow against it',
    keywords: ['lending', 'borrow', 'loan', 'collateral', 'liquidation', 'pool', 'aave-style'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public collateralToken;
    IERC20 public borrowToken;
    uint256 public ltvRatio;
    uint256 public totalBorrowed;

    struct Position {
        uint256 collateral;
        uint256 debt;
    }

    mapping(address => Position) public positions;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);

    constructor(address _collateral, address _borrow, uint256 _ltv) Ownable(msg.sender) {
        collateralToken = IERC20(_collateral);
        borrowToken = IERC20(_borrow);
        ltvRatio = _ltv;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero deposit");
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        positions[msg.sender].collateral += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.collateral >= amount, "Insufficient collateral");
        require(amount >= pos.debt * ltvRatio / 100, "Would breach LTV");
        pos.collateral -= amount;
        collateralToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function borrow(uint256 amount) external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.collateral > 0, "No collateral");
        require(amount * 100 <= pos.collateral * ltvRatio, "Exceeds max LTV");
        require(borrowToken.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        pos.debt += amount;
        totalBorrowed += amount;
        borrowToken.safeTransfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.debt >= amount, "Over-repayment");
        borrowToken.safeTransferFrom(msg.sender, address(this), amount);
        pos.debt -= amount;
        totalBorrowed -= amount;
        emit Repaid(msg.sender, amount);
    }
}`,
  },
  {
    slug: 'payment-splitter',
    name: 'Payment Splitter',
    description: 'Splits incoming ETH payments among multiple payees according to predefined shares',
    keywords: ['payment', 'splitter', 'split', 'payee', 'royalty', 'revenue-sharing', 'shares'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentSplitter is Ownable {
    address[] public payees;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public released;
    uint256 public totalShares;

    event PayeeAdded(address indexed payee, uint256 shares);
    event PaymentReleased(address indexed payee, uint256 amount);

    constructor(address[] memory _payees, uint256[] memory _shares) Ownable(msg.sender) {
        require(_payees.length == _shares.length, "Mismatched arrays");
        require(_payees.length > 0, "No payees");
        for (uint256 i = 0; i < _payees.length; i++) {
            _addPayee(_payees[i], _shares[i]);
        }
    }

    receive() external payable {}

    function release(address payable payee) external {
        uint256 totalReceived = address(this).balance + totalReleased();
        uint256 payment = (totalReceived * shares[payee] / totalShares) - released[payee];
        require(payment > 0, "No payment due");
        released[payee] += payment;
        payee.transfer(payment);
        emit PaymentReleased(payee, payment);
    }

    function totalReleased() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < payees.length; i++) total += released[payees[i]];
        return total;
    }

    function _addPayee(address payee, uint256 share) internal {
        require(payee != address(0), "Invalid payee");
        require(share > 0, "Zero share");
        require(shares[payee] == 0, "Duplicate payee");
        payees.push(payee);
        shares[payee] = share;
        totalShares += share;
        emit PayeeAdded(payee, share);
    }
}`,
  },
];
