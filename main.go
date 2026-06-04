package main

import (
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func main() {
	app := application.New(application.Options{
		Name:        "Cloud Pika",
		Description: "多云对象存储管理客户端",
	})

	app.Window.New()

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
