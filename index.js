'use strict'

const utils = require('./libs/utils')
const wav = require('./libs/wav')
const mp3Decode = require('./libs/decoder-mp3')
const path = require('path')

class Mp32Wav {

  constructor(input_file_path, output_dir) {

    if (!utils.checkArgsNotNull(...input_file_path)) {
      throw new Error('err arguments')
    }
    output_dir = utils.judgeNotNull(output_dir) ? output_dir : utils.splitFileDir(input_file_path)
    this._input_file_path = input_file_path
    this._input_file_name = utils.splitFilename(input_file_path)
    this._output_dir = output_dir
    this._output_file_name = this._input_file_name.toString().replace(/\.mp3/i, '')
  }

  async exec() {

    try {
      const mp3DecodeRes = await this.decodeMp3(this._input_file_path)
      const wavPath = this.saveForWav(mp3DecodeRes.data, this._output_dir, this._output_file_name, mp3DecodeRes.sampleRate, mp3DecodeRes.channels, mp3DecodeRes.float)
      console.log(`Mp32Wav convert to wav file successfully, saving on: ${wavPath}`)
    } catch (err) {
      console.error(`mp3 to wav exec err: ${err.message}`)
    }
  }

  // create to be used with Promises and to return the values when done
  async execAsync() {
    
    try {
      const mp3DecodeRes = await this.decodeMp3(this._input_file_path)
      const wavPath = await this.saveForWavAsync(mp3DecodeRes.data, this._output_dir, this._output_file_name, mp3DecodeRes.sampleRate, mp3DecodeRes.channels, mp3DecodeRes.float)
      console.log(`Mp32Wav execAsync convert to wav file successfully, saving on: ${wavPath}`)
      return wavPath;
    } catch (err) {
      console.error(`### Mp32Wav execAsync err: ${err.message}`)
      throw new Error(`Mp32Wav execAsync err: ${err.message}`)
    }
  }

  async decodeMp3(file_path) {

    try {
      let buffer = utils.readFile(file_path)
      return new Promise(async resolve => {
        const audioBuffer = await mp3Decode(buffer)
        const channelData = []
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channelData[i] = audioBuffer.getChannelData(i)
        }
        return resolve({
          data: channelData,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          float: audioBuffer.floatingPoint
        })
      })
    } catch (err) {
      throw new Excetpion(`decode mp3 err: ${err.message}`)
    }
  }

  saveForWav(buffer, savePath, filename = '', sampleRate, channels, float = true) {

    if (!filename) filename = 'temp-' + utils.generateTimestampRandom()
    const fileFullName = filename + '.wav'
    const fileFullPath = path.join(savePath, fileFullName)

    try {
      const wavData = wav.encode(buffer, {sampleRate: sampleRate, float: float, channels: channels})
      utils.saveToPath(fileFullPath, wavData)
      return fileFullPath
    } catch (err) {
      throw new Error(`saveForWav err: ${err.message}`)
    }
  }

  async saveForWavAsync(buffer, savePath, filename = '', sampleRate, channels, float = true) {

    try {
      return new Promise(async resolve => {
        if (!filename) filename = 'temp-' + utils.generateTimestampRandom()
        const fileFullName = filename + '.wav'
        const fileFullPath = path.join(savePath, fileFullName)

        const wavData = await wav.encode(buffer, { sampleRate: sampleRate, float: float, channels: channels })
        utils.saveToPath(fileFullPath, wavData)
        return resolve(fileFullPath)
      })
    } catch (err) {
      console.error(`### Mp32Wav saveForWavAsync err: ${err.message}`)
      // throw new Error(`saveForWav err: ${err.message}`)
      throw new Excetpion(`Mp32Wav saveForWavAsync err: ${err.message}`)
    }
  }
}

module.exports = Mp32Wav