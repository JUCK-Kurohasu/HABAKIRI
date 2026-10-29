CC ?= gcc
CFLAGS_NOPIE = -fno-pie -no-pie -fno-stack-protector -z execstack -O0 -g
CFLAGS_PIE = -fPIE -pie -fstack-protector -O0 -g
CFLAGS_ORW = -fno-pie -no-pie -O0 -g

BIN = bin
SRCS = ret2win.c pie_canary_fmt.c orw.c

all: $(BIN) $(BIN)/ret2win $(BIN)/pie_canary_fmt $(BIN)/orw

$(BIN):
	mkdir -p $(BIN)

$(BIN)/ret2win: ret2win.c
	$(CC) $(CFLAGS_NOPIE) -o $@ $<

$(BIN)/pie_canary_fmt: pie_canary_fmt.c
	$(CC) $(CFLAGS_PIE) -o $@ $<

$(BIN)/orw: orw.c
	$(CC) $(CFLAGS_ORW) -o $@ $<
	echo "FLAG{orw_ok}" > flag.txt

clean:
	rm -rf $(BIN) flag.txt

.PHONY: all clean
