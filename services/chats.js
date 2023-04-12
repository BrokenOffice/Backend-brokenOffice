const { Chat, Message, User, Report } = require("../models");

class ChatServices {
  static async createNewChat(room) {
    try {
      const existingChat = await Chat.findOne({ room });
      if (existingChat) {
        return { error: false, data: existingChat };
      }
      const newChat = await Chat.create({ room });
      return { error: false, data: newChat };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async addMessages(msg, room, userId) {
    try {
      const chatRoom = await Chat.findOne({ room });
      if (!chatRoom) {
        return { error: true, data: "Chat does not exist" };
      }
      const newMessage = await Message.create({ user: userId, content: msg });
      if (!newMessage) {
        return { error: true, data: "Message cannot be created" };
      }
      chatRoom.allMessages.push(newMessage._id);
      chatRoom.save();
      const populatedMessage = await newMessage.populate("user");
      console.log(populatedMessage);
      return { error: false, data: populatedMessage };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async getChatHistory(chatId) {
    try {
      const chat = await Chat.findById(chatId);
      if (chat.allMessages.length === 0) {
        return { error: false, data: "No Chat History" };
      }
      const chatWithMessages = await chat.populate({
        path: "allMessages",
        populate: {
          path: "user",
        },
      });
      return { error: false, data: chatWithMessages };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async getChatLength(chatRoom) {
    try {
      const chat = await Chat.find({ room: chatRoom }); 
      if (chat[0].allMessages?.length === 0) {
        return { error: false, data: "No Chat History" };
      }
      const chatLength = chat[0].allMessages.length;    
      return { error: false, data: chatLength };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async recordIssuerLength(email, chatLength, chatId, chatRoom) {
    try {
      const userWithChat = await User.findOne({
        email: email,
        "issuerMessages.chatId": chatId,
      });

      if (!userWithChat) {
        const user = await User.findOne({ email });
        user.issuerMessages?.push({
          chatId: chatId,
          chatLength: chatLength,
          chatRoom:chatRoom
        });
        user.save();
        return { error: false, data: user };
      } else {
        userWithChat.issuerMessages.map((chat) => {
          if (chat.chatId === chatId) {
            chat.chatLength = chatLength;
          }
        });
        userWithChat.save();
        return { error: false, data: userWithChat };
      }
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async recordSolverLength(email, chatLength, chatId, chatRoom) {
    try {
      const userWithChat = await User.findOne({
        email: email,
        "solverMessages.chatId": chatId,
      });

      if (!userWithChat) {
        const user = await User.findOne({ email });
        user.solverMessages?.push({
          chatId: chatId,
          chatLength: chatLength,
          chatRoom: chatRoom
        });
        user.save();
        return { error: false, data: user };
      } else {
        userWithChat.solverMessages.map((chat) => {
          if (chat.chatId === chatId) {
            chat.chatLength = chatLength;
          }
        });
        userWithChat.save();
        return { error: false, data: userWithChat };
      }
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async getIssuerChats(issuerId) {
    try {
      const issuerReports = await Report.find({issuer: issuerId})
      const issuerReportsIds = issuerReports((report) => report._id)
      const issuerChats = await Chat.find()
      return { error: false, data: issuerChats };
    } catch (error) {
      return { error: true, data: error };
    }
  }

}

module.exports = ChatServices;
