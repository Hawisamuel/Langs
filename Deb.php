<?php

function debounce(callable $callback, int $delay, string $key): mixed
{
    $lockFile = sys_get_temp_dir() . '/debounce_' . md5($key) . '.lock';
    $now = (int) (microtime(true) * 1000);

    if (file_exists($lockFile)) {
        $data = json_decode(file_get_contents($lockFile), true);
        if ($data && ($now - $data['timestamp']) < $delay) {
            // Still within the delay window, don't execute
            return null;
        }
    }

    // Execute the callback
    $result = $callback();

    // Update the lock file with the current timestamp
    file_put_contents($lockFile, json_encode(['timestamp' => $now]));

    return $result;
}

// Example usage:
$result = debounce(function() {
    return "Action executed!";
}, 3000, 'form_submit');

echo $result; // Will echo "Action executed!" only if 3 seconds have passed since the last call
