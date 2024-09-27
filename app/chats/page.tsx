"use client"
import { Database } from "@/types/supabasetype"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import ChatUI from "@/components/chats/chat"
import { supabase } from "@/utils/supabase/supabase"
import { Button } from "@/components/button"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { MenuIcon, SendIcon } from "lucide-react"
import { Input } from "@/components/input"

const channelName ="Chats"

export default function Chats() {
  
  const [inputText, setInputText] = useState("")
  const [inputName, setInputName] = useState("")
  const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Chats"]["Row"][]>([])
  const ref=useRef<any>()
  useEffect(()=>{
       //一番下までscrollする
       ref.current.scrollTop = ref.current.scrollHeight
  },[messageText.length])

  const fetchRealtimeData = () => {
    try {
      supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Chats",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const { created_at, id, message, username } = payload.new
              setMessageText((messageText) => [...messageText, { id, created_at,message, username }])
            }
     
          }
        )
        .subscribe()

      return () => supabase.channel(channelName).unsubscribe()
    } catch (error) {
      console.error(error)
    }
  }

  // 初回のみ実行するために引数に空の配列を渡している
  useEffect(() => {
    (async () => {
      let allMessages = null
      try {
        const { data } = await supabase.from("Chats").select()

        allMessages = data
      } catch (error) {
        console.error(error)
      }
      if (allMessages != null) {
        setMessageText(allMessages)
      }
    })()
    fetchRealtimeData()
  }, [])

  const onSubmitNewMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputText === "") return
    try {
    
      await supabase.from("Chats").insert({ message: inputText, username: inputName})
    } catch (error) {
      console.error(error)
    }
    setInputText("")
  }
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" aria-label="メニュー">
          <MenuIcon className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">チャットアプリ</h1>
        <div className="w-8" /> 
      </header>
      
      <div className="overflow-y-scroll h-full" ref={ref}>
        {messageText.map((message) => (
          <div
            key={message.id}
            className={`flex mb-4`}
          >
            <div className={`flex items-end`}>
            

                <span className="w-[70px] truncate text-gray-600">{message.username}</span>
              
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg`}
              >
                {message.message}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmitNewMessage(e)
          }}
          className="flex items-center space-x-2"
        >
              <Input
            type="text"
            placeholder="名前を入力..."
            value={inputName}
            onChange={(e) =>setInputName(e.target.value)}
            className="flex-grow"
          />
          <Input
            type="text"
            placeholder="メッセージを入力..."
            value={inputText}
            onChange={(e) =>setInputText(e.target.value)}
            className="flex-grow"
          />
          <Button
          disabled={inputText === "" || inputName === ""}
          className="w-[120px]"
           type="submit" size="icon" aria-label="送信">
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )}
