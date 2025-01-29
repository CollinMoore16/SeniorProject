<?php 
// "Database"
$cards = [

];

// "Token Verification" (replace with actual authentication logic)
function authenticate($token) {
    return true; // Mock authentication
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    header('Content-Type: application/json');

    // Read the JSON data
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if JSON was parsed correctly
    if (!$data || !is_array($data)) {
        echo json_encode(["status" => "error", "message" => "Invalid or empty JSON input"]);
        exit;
    }

    // Authenticate the user
    if (!isset($data['token']) || !authenticate($data['token'])) {
        echo json_encode(["status" => "error", "message" => "Authentication failed"]);
        exit;
    }

    // Check for valid card_id
    if (empty($data['card_id']) || !is_numeric($data['card_id'])) {
        echo json_encode(["status" => "error", "message" => "Invalid card_id"]);
        exit;
    }

    // Delete the card from the "database"
    global $cards;
    $cardId = intval($data['card_id']);
    $found = false;

    foreach ($cards as $index => $card) {
        if ($card['card_id'] === $cardId) {
            unset($cards[$index]);
            $found = true;
            break;
        }
    }

    if ($found) {
        echo json_encode([
            "status" => "success",
            "message" => "Card successfully deleted",
            "card_id" => $cardId
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Card not found"
        ]);
    }

    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Delete Card API</title>
</head>
<body>
    <h1>Test Delete Card</h1>
    <form id="apiForm">
        <label for="card_id">Card ID:</label>
        <input type="number" id="card_id" name="card_id" placeholder="Enter Card ID" required><br><br>

        <button type="button" onclick="sendRequest()">Delete Card</button>
    </form>

    <h2>Response</h2>
    <pre id="response"></pre>

    <script>
        async function sendRequest() {
            const url = "http://localhost/CardTrack_seniorproject/deleteCard.php";
            const data = {
                token: "mock-valid-token",
                card_id: parseInt(document.getElementById("card_id").value)
            };

            try {
                const response = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                document.getElementById("response").textContent = JSON.stringify(result, null, 2);
            } catch (error) {
                document.getElementById("response").textContent = `Error: ${error.message}`;
            }
        }
    </script>
</body>
</html>