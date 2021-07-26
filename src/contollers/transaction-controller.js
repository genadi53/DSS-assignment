const nodemailer = require("nodemailer");
const Transaction = require("../../models/Transaction");
const TransactionParts = require("../../models/Transaction_Parts");
const User = require("../../models/User");
const Part = require("../../models/CartPart");
const CartPart = require("../../models/CartPart");
const sequelize = require("sequelize");
const { v4: uuidv4 } = require("uuid");
// const Transactions = require("../../models/Transaction");

module.exports.makeNewTransaction = async (req, res) => {
  const { email, parts, address = "Sofia ..." } = req.body;
  let { totalPrice } = req.body;
  let message = "Transaction details\nProduct\t Quantity\t Price\n";
  //console.log(parts);
  try {
    User.hasMany(Transaction, { as: "User_Transaction", foreignKey: "userId" });
    Transaction.belongsTo(User, { as: "User", foreignKey: "userId" });

    Transaction.hasOne(TransactionParts, {
      as: "TransactionParts",
      foreignKey: "transactionId",
    });
    TransactionParts.belongsTo(Transaction, {
      as: "Transaction",
      foreignKey: "transactionId",
    });

    // TransactionParts.belongsToMany(Part, {
    //   as: "CartPart",
    //   foreignKey: "partId",
    // });
    // Part.belongsToMany(TransactionParts, {
    //   as: "TransactionParts",
    //   foreignKey: "partId",
    // });

    const user = await findUser(email);
    //console.log(user);
    // console.log(user[0].dataValues.uuid);

    const selledParts = [];

    for (const part of parts) {
      //console.log(part.partId);
      let id = part.uuid;
      const p = await Part.findAll({ where: { uuid: id } }).catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
      });

      if (part.quantity <= p[0].dataValues.quantity) {
        selledParts.push({ ...p[0].dataValues, quantity: part.quantity });
        message = message.concat(
          `${part.name}\t\t${part.quantity}\t $${part.price}\n`
        );
      } else {
        message = message.concat(`${part.name} is out of stock\n`);
        //console.log(totalPrice);
        totalPrice =
          Math.round((totalPrice - part.price * part.quantity) * 100) / 100;
        console.log(totalPrice);
      }
      //console.log(p)
    }

    const transaction = await createTransaction(user, address, totalPrice);
    //console.log(transaction.dataValues);

    for (let i = 0; i < selledParts.length; i++) {
      //console.log(result[i][0].dataValues.uuid);
      let p = await TransactionParts.create({
        transactionId: transaction.dataValues.uuid,
        partId: selledParts[i].uuid,
        partQuantity: selledParts[i].quantity,
      }).catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
      });
    }

    const mailMessage =
      transaction === null
        ? "No Transaction was made\n"
        : `Transaction address is ${address} 
  and you need to pay ${totalPrice}\n`.concat(message);

    selledParts.forEach(async (part) => {
      part = await updatePart(part);
    });

    //console.log(message);
    this.sendEmail(user[0].dataValues.email, mailMessage);
    res.status(200).send("Transaction completed! Email with details was send!");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: err });
  }
};

module.exports.sendEmail = async (email, message) => {
  //console.log(message);
  // MailTrap
  const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTPAR_USER,
      pass: process.env.MAILTPAR_PASS,
    },
  });

  // Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kotka5353@gmail.com",
      pass: process.env.GMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // console.log(mailMessage);

  const mainOptions = {
    from: "kotka5353@mail.com",
    to: email,
    subject: "New Transaction Was Made",
    text: message,
  };

  await transport.sendMail(mainOptions, function (err, success) {
    if (err) console.log(err);
    else console.log("*** New Email Was Send! ***");
    //res.send("Email was send");
  });
};

const findUser = async (email) => {
  const user = await User.findAll({
    where: {
      email: email,
    },
  }).catch((err) => {
    console.log(err);
    return err;
  });
  return user;
};

const createTransaction = async (user, address, totalPrice) => {
  if (Math.floor(totalPrice) === 0) return null;
  const transaction = await Transaction.create({
    uuid: uuidv4(),
    userId: user[0].dataValues.uuid,
    addressForShipping: address,
    totalPrice: Math.round(totalPrice),
  }).catch((err) => {
    console.log(err);
    return err;
  });
  return transaction;
};

const updatePart = async (part) => {
  let id = part.uuid;
  const updatedPart = await CartPart.update(
    { quantity: sequelize.literal(`quantity - ${part.quantity}`) },
    { where: { uuid: id } }
  ).catch((err) => {
    console.log(err);
    return err;
  });
  return updatedPart;
};
