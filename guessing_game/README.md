# Guessing Game

This is a CLI game that allows a user to recursively guess a secret number until the user gets it right.

## How it works
1. The program generates a random number between 1 and 100(inclusive)
2. User inputs a guess
3. if the user input is greater than or less than the secret_number, the program prints out `Too big!` or `Too small!` respectively and asks the user to give another input.
4. This process repeats until the user's input matches the secret number.

## Running the program
1. at the root of the codebase, change directory in to the `guessing_game` directory:-
```bash
$ cd guessing_game
```

2. Run the program:-
```bash
$ cargo run
```

3. guess the number until you get the answer. See the example below.

Example:-
```bash
Guess the number!
Please input your guess.
4
You guessed: 4
Too small!
Please input your guess.
50
You guessed: 50
Too small!
Please input your guess.
75
You guessed: 75
Too big!
Please input your guess.
65
You guessed: 65
Too big!
Please input your guess.
60
You guessed: 60
Too big!
Please input your guess.
55
You guessed: 55
Too small!
Please input your guess.
58
You guessed: 58
Too big!
Please input your guess.
57
You guessed: 57
You win!
```