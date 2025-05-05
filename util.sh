if [ "$1" = "clear" ]
then
    docker ps -q | xargs docker stop
    docker system prune -f
    docker rmi social-login-proto-client
    docker rmi social-login-proto-server1
    docker rmi social-login-proto-server2
elif [ "$1" = "run" ]
then
    rm -rf client/src/.next
    docker compose -f compose.local.yaml build
    docker compose -f compose.local.yaml up
elif [ "$1" = "bash" ]
then
    docker compose -f compose.local.yaml build
    docker compose -f compose.local.yaml up -d
    if [ "$2" = "client" ]
    then
        docker exec -it client bash
    elif [ "$2" = "server1" ]
    then
        docker exec -it server1 bash
    elif [ "$2" = "server2" ]
    then
        docker exec -it server2 bash
    elif [ "$2" = "redis" ]
    then
        docker exec -it redis bash
    else
        echo "specify client, server1, server2 or redis."
    fi
    docker compose -f compose.local.yaml down
elif [ "$1" = "build" ]
then
    docker compose -f compose.local.yaml build
    docker compose -f compose.local.yaml up -d
    rm -rf client/src/out
    docker exec client npm run build
    docker compose -f compose.local.yaml down
elif [ "$1" = "deploy" ]
then
    echo deploy
else
    echo "no such command"
    exit 1
fi
