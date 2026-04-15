// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlitzQuiz {
    struct Player {
        uint256 bestScore;
        uint256 totalGames;
    }

    mapping(address => Player) public players;
    mapping(address => bool) private hasJoinedLeaderboard;

    address[] private leaderboard;

    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 bestScore,
        uint256 totalGames
    );

    function submitScore(uint256 score) external {
        Player storage player = players[msg.sender];

        player.totalGames += 1;

        if (score > player.bestScore) {
            player.bestScore = score;
        }

        if (!hasJoinedLeaderboard[msg.sender]) {
            hasJoinedLeaderboard[msg.sender] = true;
            leaderboard.push(msg.sender);
        }

        emit ScoreSubmitted(
            msg.sender,
            score,
            player.bestScore,
            player.totalGames
        );
    }

    function getPlayer(
        address user
    ) external view returns (uint256, uint256) {
        Player memory player = players[user];
        return (player.bestScore, player.totalGames);
    }

    function getLeaderboard()
        external
        view
        returns (
            address[] memory users,
            uint256[] memory bestScores,
            uint256[] memory totalGames
        )
    {
        uint256 length = leaderboard.length;

        users = new address[](length);
        bestScores = new uint256[](length);
        totalGames = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            address playerAddress = leaderboard[i];
            Player memory player = players[playerAddress];

            users[i] = playerAddress;
            bestScores[i] = player.bestScore;
            totalGames[i] = player.totalGames;
        }
    }
}
