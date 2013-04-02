class ReportError(Exception):
    """The general purpose Delphos exception class.  Use when a more specific exception is not necessary
    """
    def __init__(self, value=""):
        self.value = value 