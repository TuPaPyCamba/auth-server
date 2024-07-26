import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import mongoose from 'mongoose'

import { PORT, MONGODB_URI, SECRET } from './config'

const server = express()

