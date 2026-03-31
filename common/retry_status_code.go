package common

import (
	"strconv"
	"strings"
	"sync"
)

var retryStatusCodeSet = map[int]struct{}{}
var retryStatusCodeSetMutex sync.RWMutex

func UpdateRetryStatusCodes(raw string) {
	RetryStatusCodes = raw

	parsed := make(map[int]struct{})
	for _, item := range strings.Split(raw, ",") {
		codeStr := strings.TrimSpace(item)
		if codeStr == "" {
			continue
		}
		code, err := strconv.Atoi(codeStr)
		if err != nil || code <= 0 {
			continue
		}
		parsed[code] = struct{}{}
	}

	retryStatusCodeSetMutex.Lock()
	retryStatusCodeSet = parsed
	retryStatusCodeSetMutex.Unlock()
}

func IsConfiguredRetryStatusCode(statusCode int) bool {
	retryStatusCodeSetMutex.RLock()
	_, ok := retryStatusCodeSet[statusCode]
	retryStatusCodeSetMutex.RUnlock()
	return ok
}