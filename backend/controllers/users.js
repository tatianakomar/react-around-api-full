const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.getUser = (req, res) => {
  User.findOne({user})
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        res.status(400).send({ message: 'Validation failed:  user cannot be found.' });
      } else if (err.name === 'CastError') {
        res.status(400).send({ message: 'User not found.' });
      } else {
        res.status(500).send({ message: 'Server error' });
      }
    });
};

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('User not found.');
      }
      res.send({ data: user });
    })
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const { email, password, name, about, avatar } = req.body;
  bcrypt.hash(password, 10)
    .then(hash => User.create({
      email, password: hash, name, about, avatar
    }))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Validation failed: user cannot be created.');
      }
    })
    .catch(next);
};

module.exports.updateUser = (req, res, next) => {
  User.findByIdAndUpdate(
    { _id: req.user._id },
    { $set: { name: req.body.name, about: req.body.about } },
    { new: true, runValidators: true },
  )
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Validation failed: user cannot be updated.');
      }
    })
    .catch(next);
};

module.exports.updateAvatar = (req, res) => {
  User.findByIdAndUpdate(
    { _id: req.user._id },
    { avatar: req.body.avatar },
    { new: true, runValidators: true },
  )
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Validation failed: user cannot be updated.');
      }
    })
    .catch(next);
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      if(!user) {
        throw new UnauthorizedError('Incorrect email or password');
      }
      const token = jwt.sign({ _id: user._id}, 'tkay', {expiresIn: '7d'});
      res.send({token});
    })
    .catch(next);
}; 