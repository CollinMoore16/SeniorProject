<!DOCTYPE html>
<html>
    <head>
        <title>Account Registration Mockup</title>
    </head>
    <body>
        <h1>Register for CardTrack</h1>

        <form method="POST">
            <label>Email Address</label>
            <input type="text" name="email" require><br>

            <label>Username</label>
            <input type="text" name="username" require><br>

            <label>Password</label>
            <input type="password" name="pw" require><br>

            <label>Confirm Password</label>
            <input type="password" name="confirmpw" require><br>

            <button type="submit">Submit</button>
        </form>
    </body>
</html>

<?php
    // Placeholder account class to act as a "database entry"
    class Account {
        public $email;
        public $username;
        public $password;

        function getEmail() {
            return $this->email;
        }

        function setEmail($email) {
            $this->email = $email;
        }
        
        function setUsername($username) {
            $this->username = $username;
        }

        function getUsername() {
            return $this->username;
        }
        
        function setPassword($password) {
            $this->password = $password;
        }
    }

    // Define test accounts
    $testacct1 = new Account();
    $testacct1->setEmail("test1@email.com");
    $testacct1->setUsername("test1");
    $testacct1->setPassword("SuperSecret!");

    $testacct2 = new Account();
    $testacct2->setEmail("test2@email.com");
    $testacct2->setUsername("test2");
    $testacct2->setPassword("SuperSecret@");

    $testacct3 = new Account();
    $testacct3->setEmail("test3@email.com");
    $testacct3->setUsername("test3");
    $testacct3->setPassword("SuperSecret#");

    $testaccts = array($testacct1, $testacct2, $testacct3);

    if($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = trim($_POST['email']);
        $username = trim($_POST['username']);
        $pw = trim($_POST['pw']);
        $confirmpw = trim($_POST['confirmpw']);

        // Form request into JSON
        $input = [
            'email' => $email,
            'username' => $username,
            'password' => $pw, // will be hashed, but not for the sake of this example
            'confirm_password' => $confirmpw
        ];

        $jsonInput = json_encode($input);
        echo "JSON input for request:";
        echo $jsonInput;

        $jsonResponse = "";

        echo "<h2>";
        // Validate user input.  This will be handled on the API side in the future

        // Check if email address is valid
        if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo $email . " is not a valid email address. Please enter a different one.";
            $jsonResponse = [
                'success' => false,
                'message' => "Invalid email address.",
            ];
            echo "</h1>JSON Response:";
            echo json_encode($jsonResponse);

            return; // Email address is not valid, don't continue
        }

        // Loop through accounts to see if email has already been used
        foreach($testaccts as &$acct) {
            if(strcasecmp($acct->getEmail(), $email) == 0) {
                echo $email . " is already registered to a different account.";
                $jsonResponse = [
                    'success' => false,
                    'message' => "Email address is already in use.",
                ];
                echo "</h1>JSON Response:";
                echo json_encode($jsonResponse);

                return; // Email is in use, don't continue
            }
        }

        // Check if username meets requirements

        // Regex written by ChatGPT, it's verifying that the username has only:
        // Letters a-Z
        // Numbers 0-9
        // - and _
        // and is less than or equal to 16 characters
        if(!(preg_match('/^[a-zA-Z0-9\-_]+$/', $username) && strlen($username) <= 16)) {
            echo "Username is invalid. Your username is allowed to have letters, numbers, hyphens, underscores, and must be 16 characters or less.";
            $jsonResponse = [
                'success' => false,
                'message' => "Invalid username.",
            ];
            echo "</h1>JSON Response:";
            echo json_encode($jsonResponse);

            return;
        }
        
        // Loop through accounts to see if username has already been used
        foreach($testaccts as &$acct) {
            if(strcasecmp($acct->getUsername(), $username) == 0) {
                echo $username . " is taken. Please choose a different username.";
                $jsonResponse = [
                    'success' => false,
                    'message' => "Username is already in use.",
                ];
                echo "</h1>JSON Response:";
                echo json_encode($jsonResponse);

                return; // Email is in use, don't continue
            }
        }

        if($pw !== $confirmpw) {
            echo "The entered passwords do not match.";
            $jsonResponse = [
                'success' => false,
                'message' => "Passwords do not match.",
            ];
            echo "</h1>JSON Response:";
            echo json_encode($jsonResponse);

            return;
        }

        if(!(strlen($pw) >= 10 && preg_match('/[A-Z]/', $pw) && preg_match('/[\W_]/', $pw))) {
            echo "Password does not meet requirements. Ensure it is at least 10 characters, and has at least one special character and capital letter";
            $jsonResponse = [
                'success' => false,
                'message' => "Password doesn't meet requirements.",
            ];
            echo "</h1>JSON Response:";
            echo json_encode($jsonResponse);

            return;
        }
        echo "</h2>";

        // If we reach this point, all of the checks have passed. Add account to the database
        $jsonResponse = [
            'success' => true,
            'message' => "Account was created successfully.",
        ];

        echo "JSON Response:";
        echo json_encode($jsonResponse);
    }
?>