.data
enterValue: .asciiz "The next value to add: "
answer: .asciiz "The answer is: "
newLine: .asciiz "\n"

.text

li $s0, 0 # initialize $s0 to 0

main:
	la $a0, enterValue # set argument a0 to enterF 
	jal readInput # run subroutine that displays enterF text and gets input

	add $s1, $s1, $s0
	beq $s0, $0, printAnswer
	
	j main  
	
readInput:
	li $v0, 4 # print $a0 to the screen
	syscall
	
	li $v0, 5 # read an integer from the screen
	syscall
	move $s0, $v0
	
	jr $ra
	
printAnswer:
	li $v0, 4 # print the answer text to the screen
	la $a0, answer
	syscall
	
	li $v0, 1 # print result of $s0
	move $a0, $s1
	syscall
	
    li $v0, 4 # print the new line
	la $a0, newLine
	syscall
	
	li $v0, 10 # terminate program
    syscall 