<?php 
//"the database"
$cards = [];
$nextId = 1;

//"token verification" (will need replacced with the actual logic when we have access to the database)
function authenticate($token) {
    return true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    header('content-Type: application/json');

//reads the JSON data
    $data = json_decode(file_get_contents('php://input'), true);

//checks if JSON was parsed correctly
    if (!$data || !is_array($data)) {
        echo json_encode(["status" => "error", "message" => "Invalid or empty JSON input"]);
        exit;
    }

//will authenticate the users account
    if (!isset($data['token']) || !authenticate($data['token'])) {
        echo json_encode(["status" => "error", "message" => "authentication failed"]);
        exit;
    } 



    if (
        empty($data['card_name']) ||
        empty($data['category']) ||
        empty($data['set_name']) ||
        empty($data['rarity']) ||
        empty($data['condition']) ||
        !isset($data['value'])
     ) {
        echo json_encode(["status" => "error", "message" => "Invalid input data"]);
        exit;
    }


//adds the card into the "database"
    global $cards, $nextId;
    $cardId = $GLOBALS['nextId']++;
    $newCard = [
        "card_id" => $cardId,
        "card_name" => $data['card_name'],
        "category" => $data['category'],
        "set_name" => $data['set_name'],
        "rarity" => $data['rarity'],
        "condition" => $data['condition'],
        "value" => $data['value'],
    ];
    $cards[] = $newCard;

//status message
    echo json_encode([
        "status" => "success",
        "message" => "card added successfully",
        "card_id" => $cardId
    ]);
    exit;
}
?>

<!DOCTYPE html>

<head>
    <title>Test API</title>
</head>

<body>
    <h1>Test Add Card</h1>
    <form id="apiForm">
        <label for="card_name">Card Name:</label>
        <input type="text" id="card_name" name="card_name" placeholder="Enter Card Name" required><br><br>

        <label for="category">Category:</label>
        <input type="text" id="category" name="category" placeholder="pokemon? Yu-gi-oh? Magic?" required><br><br>

        <label for="set_name">Set Name:</label>
        <input type="text" id="set_name" name="set_name" placeholder="name of the set" required><br><br>

        <label for="rarity`">Rarity:</label>
        <input type="text" id="rarity" name="rarity" placeholder="common, uncommon, rare, etc." required><br><br>

        <label for="condition">Condition:</label>
        <input type="text" id="condition" name="condition" placeholder="bad, okay, good, very good, mint" required><br><br>

        <label for="value">Value:</label>
        <input type="number" id="value" name="value" placeholder="enter value in USD" step="0.01" required><br><br>

        <button type="button" onclick="sendRequest()">Submit New Card!</button>
    </form>

    <h2>Response</h2>
    <pre id="response"></pre>

    <script>
        async function sendRequest() {
            const url = "http://localhost/CardTrack_seniorproject/addCard.php";
            const data = {
                token: "mock-valid-token",
                card_name: document.getElementById("card_name").value,
                category: document.getElementById("category").value,
                set_name: document.getElementById("set_name").value,
                rarity: document.getElementById("rarity").value,
                condition: document.getElementById("condition").value,
                value: parseFloat(document.getElementById("value").value)
            };

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                document.getElementById("response").textContent = JSON.stringify(result, null, 2);
            } catch (error) {
                document.getElementById("response").textContent = 'Error: ${error.message}';
            }
        }

    </script>
</body>
</html>