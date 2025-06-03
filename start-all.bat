@echo off
title Distributed Calc - RabbitMQ

start cmd /k "npm run consumer"
start cmd /k "npm run worker"
start cmd /k "npm run producer"
