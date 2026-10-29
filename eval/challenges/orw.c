#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>

// Synthetic ORW target: reads a "flag" file and prints it.
// Used to test open/read/write shellcode (no execve).
int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    int fd = open("flag.txt", O_RDONLY);
    if (fd < 0) { perror("open"); return 1; }
    char buf[128];
    ssize_t n = read(fd, buf, sizeof(buf) - 1);
    if (n < 0) { perror("read"); return 1; }
    buf[n] = '\0';
    write(1, buf, n);
    close(fd);
    return 0;
}
