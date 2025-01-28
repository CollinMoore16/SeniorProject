public class Main {
    
    <?php
// sample database
$cards = [
    [
        "id" => 1,
        "card_name" => "Pikachu",
        "type" => "Electric",
        "rarity" => "Rare",
        "favorite" => true
    ],
    [
        "id" => 2,
        "card_name" => "Charizard",
        "type" => "Fire",
        "rarity" => "Ultra Rare",
        "favorite" => false
    ]
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');

    //Filtering 

$type = isset($_GET['type']) ? $_GET['type'] : null;
$rarity = isset($_GET['rarity']) ? $_GET['rarity'] : null;
$favorite = isset($_GET['favorite']) ? filter_var($_GET['favorite'], FILTER_VALIDATE_BOOLEAN) : null;


$filteredCards = array_filter($cards, function ($card) use ($type, $rarity, $favorite) {
    $typeMatch = $type ? $card['type'] === $type : true;
    $rarityMatch = $rarity ? $card['rarity'] === $rarity : true;
    $favoriteMatch = isset($favorite) ? $card['favorite'] === $favorite : true;
    return $typeMatch && $rarityMatch && $favoriteMatch;
});

echo json_encode(array_values($filteredCards));
    exit;
}

//Add and Delete methods will be attached to this but created by teammates

