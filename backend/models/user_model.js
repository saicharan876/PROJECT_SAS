const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    // Profile fields
    githubUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    university: { type: String, trim: true, default: '' },
    degree: { type: String, trim: true, default: '' },
    graduationYear: { type: Number },
    skills: [{ type: String, trim: true }],
    bio: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

// Exclude password from JSON output by default
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
