#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static const char *SECRET = "FLAG{fmt_leak_ok}";

void vuln(void) {
    char buf[128];
    printf("input: ");
    fflush(stdout);
    if (fgets(buf, sizeof(buf), stdin) == NULL) return;
    // intentional format string vulnerability
    printf(buf);
    printf("\n");
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    vuln();
    return 0;
}
