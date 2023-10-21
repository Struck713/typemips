.data
enterW: .asciiz "Enter a value for w: "
enterX: .asciiz "Enter a value for x: "
enterY: .asciiz "Enter a value for y: "
enterZ: .asciiz "Enter a value for z: "
valueX: .asciiz "The value of x is: "

.text
main:
	la $a0, enterW # set argument a0 to enterF 
	jal readInput # run subroutine that displays enterW text and gets input
	move $s1, $s0  # move input for w into $s1
	
	la $a0, enterX # set argument a0 to enterX
	jal readInput # run subroutine that displays enterX text and gets input
	move $s2, $s0 # move input for x into $s2
	
	la $a0, enterY # set argument a0 to enterY
	jal readInput # run subroutine that displays enterY text and gets input
	move $s3, $s0 # move input for y into $s3
	
	la $a0, enterZ # set argument a0 to enterZ
	jal readInput # run subroutine that displays enterZ text and gets input
	move $s4, $s0  # move input for z into $s4
	
	sub $t0, $s2, $s1 # compute (x - y)
	slt $t1, $s1, $t0 # compute (x - y) > w
	
	# if (x - y) >= w then jump to ifTrue
	bne $t1, $zero, ifTrue
	beq $t1, $s1, ifTrue
	b ifFalse

ifTrue:
	move $s2, $s3
	j terminate

ifFalse:
	move $s2, $s4
	j terminate
	
readInput:
	li $v0, 4 # print $a0 to the screen
	syscall
	
	li $v0, 5 # read an integer from the screen
	syscall
	move $s0, $v0
	
	jr $ra

terminate:
	li $v0, 4 # print the answer text to the screen
	la $a0, valueX
	syscall

	li $v0, 1 # print result of $s2
	move $a0, $s2
	syscall
	
	li $v0, 11 # print new line character
	la $a0, '\n'
	syscall

	li $v0, 10 # terminate program
    syscall  