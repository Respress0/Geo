#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
USER_ID="${USER_ID:-test-user}"

jq_cmd="jq -C ."
if ! command -v jq >/dev/null 2>&1; then
  jq_cmd="cat"
fi

hdrs=("-H" "Content-Type: application/json" "-H" "X-User-Id: $USER_ID")
if [ -n "$AUTH_TOKEN" ]; then
  hdrs+=("-H" "Authorization: Bearer $AUTH_TOKEN")
fi

echo "Using BASE_URL=$BASE_URL"

generate_id(){
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen
  else
    # fallback
    echo "$(date +%s%N)-$RANDOM"
  fi
}

curl_req(){
  local method="$1"
  local url="$2"
  local data="${3:-}"
  echo "---- $method $url ----"
  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    curl -s "${hdrs[@]}" -X "$method" "$url" | eval $jq_cmd
  else
    curl -s "${hdrs[@]}" -X "$method" "$url" -d "$data" | eval $jq_cmd
  fi
  echo
}

# 1) GET tasks (initial)
echo "[1] GET /api/tasks"
curl_req GET "$BASE_URL/api/tasks"

# 2) POST create task
TASK_ID=$(generate_id)
TODAY=$(date +%Y-%m-%d)
TASK_JSON=$(cat <<EOF
{"id":"$TASK_ID","title":"Test task from script","date":"$TODAY","time":"12:00","timer_minutes":1,"completed":false,"createdAt":"$(date --iso-8601=seconds)"}
EOF
)

echo "[2] POST /api/tasks -> create $TASK_ID"
curl_req POST "$BASE_URL/api/tasks" "$TASK_JSON"

# 3) GET tasks to verify
echo "[3] GET /api/tasks (after create)"
curl_req GET "$BASE_URL/api/tasks"

# 4) PUT update task
UPDATED_JSON=$(cat <<EOF
{"title":"Updated task from script","date":"$TODAY","time":"14:00","timer_minutes":2,"completed":true}
EOF
)

echo "[4] PUT /api/tasks/$TASK_ID -> mark completed"
curl_req PUT "$BASE_URL/api/tasks/$TASK_ID" "$UPDATED_JSON"

# 5) GET to verify update
echo "[5] GET /api/tasks (after update)"
curl_req GET "$BASE_URL/api/tasks"

# 6) POST clear-completed for today
CLEAR_JSON=$(cat <<EOF
{"today":"$TODAY"}
EOF
)

echo "[6] POST /api/tasks/clear-completed"
curl_req POST "$BASE_URL/api/tasks/clear-completed" "$CLEAR_JSON"

# 7) Create another task and DELETE it
TASK_ID2=$(generate_id)
TASK2_JSON=$(cat <<EOF
{"id":"$TASK_ID2","title":"To be deleted","date":"$TODAY","time":"09:00","timer_minutes":0,"completed":false,"createdAt":"$(date --iso-8601=seconds)"}
EOF
)

echo "[7] POST create task $TASK_ID2"
curl_req POST "$BASE_URL/api/tasks" "$TASK2_JSON"

echo "[8] DELETE /api/tasks/$TASK_ID2"
curl_req DELETE "$BASE_URL/api/tasks/$TASK_ID2"

# 8) POST clear-all (cleanup)
echo "[9] POST /api/tasks/clear-all"
curl_req POST "$BASE_URL/api/tasks/clear-all" "{}"

curl_req(){
  local method=$1 url=$2 data=${3:-}
  local http_code
  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    http_code=$(curl -s -o /tmp/resp.json -w "%{http_code}" "${hdrs[@]}" -X "$method" "$url")
  else
    http_code=$(curl -s -o /tmp/resp.json -w "%{http_code}" "${hdrs[@]}" -X "$method" "$url" -d "$data")
  fi
  echo "---- $method $url -> HTTP $http_code ----"
  cat /tmp/resp.json | eval $jq_cmd
  echo
  # Пример ассерта:
  # [[ "$http_code" =~ ^2[0-9]{2}$ ]] || { echo "FAIL: expected 2xx"; exit 1; }
}

echo "Done."
