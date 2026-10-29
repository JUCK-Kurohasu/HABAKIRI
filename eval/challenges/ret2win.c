#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void win(void) {
    puts("FLAG{ret2win_ok}");
    fflush(stdout);
}

void vuln(void) {
    char buf[64];
    printf("input: ");
    fflush(stdout);
    read(0, buf, 256);
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    vuln();
    puts("normal exit");
    return 0;
}
